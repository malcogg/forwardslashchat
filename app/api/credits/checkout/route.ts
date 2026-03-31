import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateUser } from "@/lib/auth";

const PACKS: Record<string, { credits: number; priceCents: number; label: string }> = {
  "1000": { credits: 1000, priceCents: 2900, label: "Rescan Credits — 1,000 pages" },
  "3000": { credits: 3000, priceCents: 7900, label: "Rescan Credits — 3,000 pages" },
  "10000": { credits: 10000, priceCents: 19900, label: "Rescan Credits — 10,000 pages" },
};

/**
 * POST /api/credits/checkout
 * Create a Stripe Checkout Session to purchase rescan credits.
 * Body: { pack: "1000" | "3000" | "10000" }
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const packKey = String((body as { pack?: string }).pack ?? "1000");
  const pack = PACKS[packKey] ?? PACKS["1000"];

  const stripe = new Stripe(secret);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const successUrl = `${baseUrl}/dashboard?credits=success`;
  const cancelUrl = `${baseUrl}/dashboard?credits=cancel`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: pack.label, description: "Credits are used for rescans after your initial build." },
          unit_amount: pack.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      purpose: "credits",
      userId: user.userId,
      credits: String(pack.credits),
      pack: packKey,
    },
  });

  return NextResponse.json({ url: session.url, credits: pack.credits, priceCents: pack.priceCents });
}

