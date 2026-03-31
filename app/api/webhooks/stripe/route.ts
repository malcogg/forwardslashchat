import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { customers, orders, stripeEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enqueueJob } from "@/lib/jobs";

/**
 * POST /api/webhooks/stripe
 * Stripe webhook. Verifies signature, handles checkout.session.completed.
 * Configure in Stripe Dashboard: webhooks -> add endpoint -> your_url/api/webhooks/stripe
 * Events: checkout.session.completed
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    console.error("Stripe webhook signature error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!db) return NextResponse.json({ received: true });

  // Idempotency: Stripe retries webhooks. Record eventId and short-circuit duplicates.
  try {
    await db.insert(stripeEvents).values({
      eventId: event.id,
      type: event.type,
      orderId: null,
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const paidSessionEvents = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]);

  if (paidSessionEvents.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const paymentStatus = session.payment_status;
    const notifyEmail =
      (session.customer_details?.email as string | undefined) ??
      (session.customer_email as string | undefined) ??
      undefined;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Only mark paid when Stripe says it's paid (prevents edge async cases).
    if (paymentStatus && paymentStatus !== "paid") {
      return NextResponse.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await db
      .update(orders)
      .set({
        status: "paid",
        paymentProvider: "stripe",
        paymentId: paymentIntentId ?? session.id,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Update stripe event row with orderId for auditability (best-effort)
    await db
      .update(stripeEvents)
      .set({ orderId })
      .where(eq(stripeEvents.eventId, event.id));

    // Auto-fulfillment: enqueue background crawl/build (deduped by orderId)
    try {
      const [customer] = await db.select().from(customers).where(eq(customers.orderId, orderId));
      if (customer) {
        await enqueueJob({
          type: "auto_crawl_customer",
          dedupeKey: `auto_crawl_${orderId}`,
          payload: {
            orderId,
            customerId: customer.id,
            notifyEmail: notifyEmail ?? null,
          },
        });
      }
    } catch (e) {
      console.error("[stripe webhook] enqueue auto crawl failed:", e);
    }
  }

  return NextResponse.json({ received: true });
}
