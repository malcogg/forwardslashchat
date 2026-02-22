import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { orders, customers, checkoutLeads } from "@/db/schema";
import {
  sanitizeFirstName,
  sanitizeBusinessName,
  sanitizeDomain,
  sanitizeWebsiteUrl,
  sanitizeEmail,
  isValidEmail,
  isValidPlanSlug,
  isValidUrl,
} from "@/lib/validation";

const VALID_ADD_ONS = new Set([
  "dns",
  "ai-chatbot",
  "logo",
  "seo",
  "blog",
  "starter",
  "new-build",
  "redesign",
  "social-media",
]);

function sanitizeAddOns(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === "string" && VALID_ADD_ONS.has(v))
    .slice(0, 10);
}

function bundleYearsFromPlanSlug(planSlug: string): number {
  if (planSlug === "starter-bot" || planSlug === "chatbot-1y") return 1;
  if (planSlug === "chatbot-2y") return 2;
  if (planSlug === "chatbot-3y") return 3;
  return 0; // website plans: starter, new-build, redesign
}

function planNameFromSlug(planSlug: string): string {
  const map: Record<string, string> = {
    "starter-bot": "Starter Bot — 5 pages, 1 year",
    "chatbot-1y": "AI Chatbot (1 year)",
    "chatbot-2y": "AI Chatbot (2 years)",
    "chatbot-3y": "AI Chatbot (3 years)",
    starter: "Quick WordPress Starter",
    "new-build": "Brand New Website Build",
    redesign: "Website Redesign / Refresh",
  };
  return map[planSlug] ?? planSlug;
}

/**
 * POST /api/checkout/stripe
 * Checkout form → lead + order + customer + Stripe Checkout Session.
 * Returns { url } to redirect to Stripe's prebuilt checkout page.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe not configured. Add STRIPE_SECRET_KEY to your environment." },
      { status: 503 }
    );
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      firstName,
      email,
      phone,
      businessName,
      domain,
      websiteUrl,
      planSlug,
      addOns,
      amountCents,
    } = body as Record<string, unknown>;

    if (
      typeof firstName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof businessName !== "string" ||
      typeof domain !== "string" ||
      typeof websiteUrl !== "string" ||
      !isValidPlanSlug(planSlug) ||
      typeof amountCents !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid: firstName, email, phone, businessName, domain, websiteUrl, planSlug, amountCents" },
        { status: 400 }
      );
    }

    const safeFirstName = sanitizeFirstName(firstName);
    const safeEmail = sanitizeEmail(email);
    const safePhone = phone.toString().trim().slice(0, 25);
    const safeBusinessName = sanitizeBusinessName(businessName);
    const safeDomain = sanitizeDomain(domain);
    const safeWebsiteUrl = sanitizeWebsiteUrl(websiteUrl);

    if (!safeFirstName) {
      return NextResponse.json({ error: "First name required" }, { status: 400 });
    }
    if (!isValidEmail(safeEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!safePhone || safePhone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid phone required (min 10 digits)" }, { status: 400 });
    }
    if (!safeBusinessName) {
      return NextResponse.json({ error: "Business name required" }, { status: 400 });
    }
    if (!safeDomain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }
    if (!safeWebsiteUrl || !isValidUrl(safeWebsiteUrl)) {
      return NextResponse.json({ error: "Valid website URL required" }, { status: 400 });
    }
    if (amountCents < 100 || amountCents > 999_999_99) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const safeAddOns = sanitizeAddOns(addOns);
    const bundleYears = bundleYearsFromPlanSlug(String(planSlug));
    const dnsHelp = safeAddOns.includes("dns");
    const planName = planNameFromSlug(String(planSlug));

    // 1) Save lead (for abandonment emails, records)
    await db.insert(checkoutLeads).values({
      firstName: safeFirstName,
      email: safeEmail,
      phone: safePhone,
      businessName: safeBusinessName,
      domain: safeDomain,
      websiteUrl: safeWebsiteUrl,
      planSlug: String(planSlug),
      addOns: safeAddOns,
      amountCents,
    });

    // 2) Create order (pending) + customer
    const [order] = await db
      .insert(orders)
      .values({
        amountCents,
        bundleYears,
        planSlug: String(planSlug),
        addOns: safeAddOns,
        dnsHelp,
        status: "pending",
      })
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const prepaidUntil = new Date();
    prepaidUntil.setFullYear(prepaidUntil.getFullYear() + (bundleYears || 1));

    const isStarterBot = String(planSlug) === "starter-bot";

    const [customer] = await db
      .insert(customers)
      .values({
        orderId: order.id,
        businessName: safeBusinessName,
        domain: safeDomain,
        subdomain: "chat",
        websiteUrl: safeWebsiteUrl.startsWith("http") ? safeWebsiteUrl : `https://${safeWebsiteUrl}`,
        estimatedPages: isStarterBot ? 5 : undefined,
        prepaidUntil,
        status: "content_collection",
      })
      .returning();

    if (!customer) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    // 3) Create Stripe Checkout Session (prebuilt form)
    const stripe = new Stripe(secret);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const successUrl = `${baseUrl}/thank-you?orderId=${order.id}`;
    const cancelUrl = `${baseUrl}/checkout`;

    const addOnLabels = safeAddOns.length > 0 ? ` + ${safeAddOns.join(", ")}` : "";
    const lineItemName = `${planName} — ${safeBusinessName}${addOnLabels}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: safeEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: lineItemName,
              description: `AI chatbot for ${safeDomain}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
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
