import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";

/**
 * POST /api/checkout/stripe
 * Creates order + customer, then Stripe Checkout Session. Returns { url } to redirect.
 * Body: same as POST /api/orders + successUrl, cancelUrl
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe not configured. Add STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    scanId,
    amountCents,
    bundleYears,
    dnsHelp,
    businessName,
    domain,
    subdomain,
    websiteUrl,
    successUrl,
    cancelUrl,
  } = body;

  if (
    typeof amountCents !== "number" ||
    typeof bundleYears !== "number" ||
    typeof businessName !== "string" ||
    typeof domain !== "string" ||
    typeof websiteUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing: amountCents, bundleYears, businessName, domain, websiteUrl" },
      { status: 400 }
    );
  }

  try {
    const [order] = await db
      .insert(orders)
      .values({
        scanId: scanId ?? null,
        amountCents,
        bundleYears,
        dnsHelp: dnsHelp ?? false,
        status: "pending",
      })
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const prepaidUntil = new Date();
    prepaidUntil.setFullYear(prepaidUntil.getFullYear() + bundleYears);

    const [customer] = await db
      .insert(customers)
      .values({
        orderId: order.id,
        businessName,
        domain,
        subdomain: subdomain ?? "chat",
        websiteUrl: websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`,
        prepaidUntil,
        status: "content_collection",
      })
      .returning();

    const stripe = new Stripe(secret);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${businessName} - ${bundleYears}-year chatbot`,
              description: `AI chatbot for ${domain}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl ?? `${baseUrl}/dashboard?orderId=${order.id}`,
      cancel_url: cancelUrl ?? `${baseUrl}/checkout`,
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
