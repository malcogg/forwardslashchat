import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId || !db) {
      return NextResponse.json({ received: true });
    }

    await db
      .update(orders)
      .set({
        status: "paid",
        paymentProvider: "stripe",
        paymentId: (typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id) ?? session.id,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  return NextResponse.json({ received: true });
}
