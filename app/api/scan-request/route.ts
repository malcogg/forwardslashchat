import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/scan-request
 * Create a pending order + customer for a signed-in user's URL.
 * Used when user arrives at dashboard with a URL to scan (post-signup flow).
 * No payment required yet - crawl runs first, payment gate after.
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let body: { url?: string; estimatedPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawUrl = body.url;
  const estimatedPages = typeof body.estimatedPages === "number" && body.estimatedPages > 0
    ? Math.min(9999, Math.round(body.estimatedPages))
    : null;
  if (!rawUrl || typeof rawUrl !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const url = rawUrl.replace(/\/$/, "").replace(/^(?!https?:\/\/)/, "https://");
  let hostname = "my-site";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  const domain = hostname;
  const businessName = domain.split(".")[0]?.replace(/-/g, " ") ?? domain;

  try {
    const [order] = await db
      .insert(orders)
      .values({
        userId: user.userId,
        amountCents: 55000, // 1-year starter placeholder; checkout will use actual tier
        bundleYears: 1,
        dnsHelp: false,
        status: "pending",
      })
      .returning();

    if (!order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const prepaidUntil = new Date();
    prepaidUntil.setFullYear(prepaidUntil.getFullYear() + 1);

    const [customer] = await db
      .insert(customers)
      .values({
        orderId: order.id,
        businessName,
        domain,
        subdomain: "chat",
        websiteUrl: url,
        estimatedPages,
        prepaidUntil,
        status: "content_collection",
      })
      .returning();

    if (!customer) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      customerId: customer.id,
    });
  } catch (e) {
    console.error("Scan request error:", e);
    return NextResponse.json(
      { error: "Failed to create scan project" },
      { status: 500 }
    );
  }
}
