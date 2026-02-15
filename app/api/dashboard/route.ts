import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/dashboard?orderId=xxx
 * Returns order + customer. Requires auth.
 * - If orderId: load that order, link to user if unclaimed, validate ownership
 * - If no orderId: return user's first order (or empty)
 */
export async function GET(request: Request) {
  const user = await getOrCreateUser();
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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

  return NextResponse.json({
    order,
    customer: customer ?? null,
  });
}
