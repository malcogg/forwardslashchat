import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, checkoutLeads } from "@/db/schema";
import { getOrCreateUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * POST /api/admin/orders/from-lead
 * Create order + customer from checkout lead (mark as paid).
 * Admin only. Use when you've confirmed payment (e.g. PayPal).
 * Body: { leadId: string }
 * Returns: { order, customer, signUpUrl } - email the signUpUrl to the customer
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!isAdmin(user.email ?? undefined)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const { leadId } = body as { leadId?: string };

  if (!leadId || typeof leadId !== "string") {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  const [lead] = await db
    .select()
    .from(checkoutLeads)
    .where(eq(checkoutLeads.id, leadId));

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const planSlug = lead.planSlug;
  const addOns = lead.addOns ?? [];
  const isWebsitePlan = ["starter", "new-build", "redesign"].includes(planSlug);
  const bundleYears = isWebsitePlan ? 0 : (planSlug === "chatbot-1y" ? 1 : 2);

  try {
    const [order] = await db
      .insert(orders)
      .values({
        amountCents: lead.amountCents,
        bundleYears,
        planSlug,
        addOns,
        dnsHelp: addOns.includes("dns"),
        status: "paid",
      })
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const websiteUrl = lead.websiteUrl?.trim()
      ? lead.websiteUrl.startsWith("http")
        ? lead.websiteUrl
        : `https://${lead.websiteUrl}`
      : `https://${lead.domain}`;

    const [customer] = await db
      .insert(customers)
      .values({
        orderId: order.id,
        businessName: lead.businessName,
        domain: lead.domain || "example.com",
        subdomain: isWebsitePlan ? "—" : "chat",
        websiteUrl,
        estimatedPages: isWebsitePlan ? null : 25,
        status: isWebsitePlan ? "pending" : "content_collection",
      })
      .returning();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || "https://forwardslash.chat";
    const signUpUrl = `${baseUrl}/sign-up?redirect_url=${encodeURIComponent(
      `${baseUrl}/dashboard?orderId=${order.id}`
    )}`;

    return NextResponse.json({
      order,
      customer: customer ?? null,
      signUpUrl,
      message: `Order created. Email the customer: "Create an account to track your order: ${signUpUrl}"`,
    });
  } catch (e) {
    console.error("Create order from lead error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
