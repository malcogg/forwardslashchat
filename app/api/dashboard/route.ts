import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, content } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard?orderId=xxx
 * Returns order + customer for the signed-in user. No payment required to load dashboard.
 * - Any signed-in user can reach the dashboard (paid or not).
 * - If orderId: load that order, link to user if unclaimed, validate ownership
 * - If no orderId: return user's first order (or empty). New users get { order: null, customer: null }.
 */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // When DB not configured or user not in DB yet, return empty dashboard (allows "Get started" UX)
    if (!db || !user.userId) {
      return NextResponse.json({ order: null, customer: null });
    }

    let order;
    if (orderId) {
    const [o] = await db.select().from(orders).where(eq(orders.id, orderId));
    order = o;
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // Claim order if unclaimed
    if (!order.userId) {
      await db.update(orders).set({ userId: user.userId }).where(eq(orders.id, orderId));
      order = { ...order, userId: user.userId };
    } else if (order.userId !== user.userId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  } else {
    // No orderId - get user's first order
    const [o] = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.userId))
      .orderBy(desc(orders.createdAt));
    order = o ?? null;
  }

  if (!order) {
    return NextResponse.json({ order: null, customer: null });
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.orderId, order.id));

  let contentCount = 0;
  if (customer) {
    const [c] = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.customerId, customer.id));
    contentCount = c?.count ?? 0;
  }

  return NextResponse.json({
    order,
    customer: customer ?? null,
    contentCount,
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dashboard] Error:", msg);
    return NextResponse.json({ error: msg || "Dashboard error" }, { status: 500 });
  }
}
