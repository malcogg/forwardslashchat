import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { customers, orders, stripeEvents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enqueueJob } from "@/lib/jobs";
import { isChatbotPlan, type CheckoutPlanSlug } from "@/lib/checkout-pricing";
import { addRescanCredits } from "@/lib/credit-balance";

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
    const purpose = session.metadata?.purpose;
    const orderId = session.metadata?.orderId;
    const paymentStatus = session.payment_status;
    const notifyEmail =
      (session.customer_details?.email as string | undefined) ??
      (session.customer_email as string | undefined) ??
      undefined;

    // Credits purchase flow (no order required)
    if (purpose === "credits") {
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits ?? 0);
      if (userId && Number.isFinite(credits) && credits > 0) {
        try {
          await addRescanCredits({
            userId,
            delta: credits,
            reason: "purchase",
            stripeSessionId: session.id,
          });
        } catch (e) {
          console.error("[stripe webhook] credit add failed:", e);
        }
      }
      return NextResponse.json({ received: true });
    }

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

    const [orderRow] = await db.select().from(orders).where(eq(orders.id, orderId));

    let notifyForJob = notifyEmail;
    if (!notifyForJob && orderRow?.userId) {
      const [u] = await db.select().from(users).where(eq(users.id, orderRow.userId));
      notifyForJob = u?.email ?? undefined;
    }

    // AI chatbot plans only: hands-off crawl → train → DNS/go-live pipeline. Website-builder SKUs are a separate product.
    const planSlug = orderRow?.planSlug ?? "";
    const isChatbotCheckout =
      typeof planSlug === "string" &&
      planSlug.length > 0 &&
      isChatbotPlan(planSlug as CheckoutPlanSlug);

    if (isChatbotCheckout) {
      try {
        const [customer] = await db.select().from(customers).where(eq(customers.orderId, orderId));
        if (customer) {
          await enqueueJob({
            type: "auto_crawl_customer",
            dedupeKey: `auto_crawl_${orderId}`,
            payload: {
              orderId,
              customerId: customer.id,
              notifyEmail: notifyForJob ?? null,
            },
          });
        }
      } catch (e) {
        console.error("[stripe webhook] enqueue auto crawl failed:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
