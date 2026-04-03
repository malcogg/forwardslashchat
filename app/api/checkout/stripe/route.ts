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
import {
  computeCheckoutAmountCents,
  planNameFromSlug,
  type CheckoutAddOnId,
  type CheckoutPlanSlug,
} from "@/lib/checkout-pricing";
import { getOrCreateUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

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
      amountCents: clientAmountCents,
      pages,
      orderId,
    } = body as Record<string, unknown>;

    if (
      typeof firstName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof businessName !== "string" ||
      typeof domain !== "string" ||
      typeof websiteUrl !== "string" ||
      !isValidPlanSlug(planSlug)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid: firstName, email, phone, businessName, domain, websiteUrl, planSlug" },
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

    const rawAddOns = sanitizeAddOns(addOns);
    const safePlanSlug = String(planSlug) as CheckoutPlanSlug;
    if (safePlanSlug === ("chatbot-3y" as unknown as CheckoutPlanSlug)) {
      return NextResponse.json({ error: "chatbot-3y not supported in checkout yet" }, { status: 400 });
    }

    // Only a subset of add-ons are billable today; ignore unknowns.
    const billableAddOns = rawAddOns.filter((a): a is CheckoutAddOnId =>
      a === "dns" || a === "starter" || a === "new-build" || a === "redesign" || a === "social-media"
    );

    let computed: ReturnType<typeof computeCheckoutAmountCents>;
    try {
      computed = computeCheckoutAmountCents({
        planSlug: safePlanSlug,
        addOns: billableAddOns,
        pages: typeof pages === "number" && Number.isFinite(pages) ? Math.round(pages) : undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid checkout options";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const bundleYears = computed.bundleYears;
    const dnsHelp = billableAddOns.includes("dns");
    const planName = planNameFromSlug(safePlanSlug);
    const serverAmountCents = computed.amountCents;

    if (serverAmountCents < 50) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (
      typeof clientAmountCents === "number" &&
      Number.isFinite(clientAmountCents) &&
      Math.abs(clientAmountCents - serverAmountCents) > 2
    ) {
      console.warn("[checkout/stripe] client amountCents ignored (mismatch)", {
        clientAmountCents,
        serverAmountCents,
        planSlug: safePlanSlug,
      });
    }

    // 1) Save lead (for abandonment emails, records)
    await db.insert(checkoutLeads).values({
      firstName: safeFirstName,
      email: safeEmail,
      phone: safePhone,
      businessName: safeBusinessName,
      domain: safeDomain,
      websiteUrl: safeWebsiteUrl,
      planSlug: safePlanSlug,
      addOns: billableAddOns,
      amountCents: serverAmountCents,
    });

    // If the user is signed in, attach order to user. Also allow paying for an existing order (dashboard flow).
    const authedUser = await getOrCreateUser(request);
    const internalUserId = authedUser?.userId ?? null;

    let order:
      | (typeof orders.$inferSelect & { id: string })
      | undefined;
    let customer:
      | (typeof customers.$inferSelect & { id: string })
      | undefined;

    const requestedOrderId = typeof orderId === "string" ? orderId : null;
    if (requestedOrderId && internalUserId) {
      const [existingOrder] = await db.select().from(orders).where(eq(orders.id, requestedOrderId));
      if (existingOrder && (existingOrder.userId === internalUserId || !existingOrder.userId)) {
        if (existingOrder.status === "paid") {
          return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
        }
        await db
          .update(orders)
          .set({
            userId: existingOrder.userId ?? internalUserId,
            amountCents: serverAmountCents,
            bundleYears,
            planSlug: safePlanSlug,
            addOns: billableAddOns,
            dnsHelp,
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, requestedOrderId));
        const [updated] = await db.select().from(orders).where(eq(orders.id, requestedOrderId));
        order = updated;

        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(eq(customers.orderId, requestedOrderId));
        if (existingCustomer) {
          const prepaidUntil = new Date();
          prepaidUntil.setFullYear(prepaidUntil.getFullYear() + (bundleYears || 1));
          await db
            .update(customers)
            .set({
              businessName: safeBusinessName,
              domain: safeDomain,
              subdomain: "chat",
              websiteUrl: safeWebsiteUrl.startsWith("http") ? safeWebsiteUrl : `https://${safeWebsiteUrl}`,
              estimatedPages: computed.estimatedPages ?? undefined,
              prepaidUntil,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, existingCustomer.id));
          const [updatedCustomer] = await db
            .select()
            .from(customers)
            .where(eq(customers.id, existingCustomer.id));
          customer = updatedCustomer;
        }
      }
    }

    if (!order) {
      // 2) Create order (pending) + customer
      const [createdOrder] = await db
        .insert(orders)
        .values({
          userId: internalUserId ?? null,
          amountCents: serverAmountCents,
          bundleYears,
          planSlug: safePlanSlug,
          addOns: billableAddOns,
          dnsHelp,
          status: "pending",
        })
        .returning();
      order = createdOrder;
      if (!order) {
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }
    }

    const prepaidUntil = new Date();
    prepaidUntil.setFullYear(prepaidUntil.getFullYear() + (bundleYears || 1));

    if (!customer) {
      const [createdCustomer] = await db
        .insert(customers)
        .values({
          orderId: order.id,
          businessName: safeBusinessName,
          domain: safeDomain,
          subdomain: "chat",
          websiteUrl: safeWebsiteUrl.startsWith("http") ? safeWebsiteUrl : `https://${safeWebsiteUrl}`,
          estimatedPages: computed.estimatedPages ?? undefined,
          prepaidUntil,
          status: "content_collection",
        })
        .returning();
      customer = createdCustomer;
      if (!customer) {
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
      }
    }

    // 3) Create Stripe Checkout Session (prebuilt form)
    const stripe = new Stripe(secret);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const successUrl = `${baseUrl}/thank-you?orderId=${order.id}`;
    const cancelUrl = `${baseUrl}/checkout`;

    const addOnLabels = billableAddOns.length > 0 ? ` + ${billableAddOns.join(", ")}` : "";
    const lineItemName = `${planName} — ${safeBusinessName}${addOnLabels}`;

    const session = await stripe.checkout.sessions.create(
      {
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
            unit_amount: serverAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        planSlug: safePlanSlug,
        pages: computed.estimatedPages != null ? String(computed.estimatedPages) : "",
        addOns: billableAddOns.join(","),
      },
      },
      { idempotencyKey: `order_${order.id}` }
    );

    // Persist session id for reconciliation
    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: session.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
