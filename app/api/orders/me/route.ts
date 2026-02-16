import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/orders/me
 * Returns current user's orders with customers (for sidebar, site list).
 */
export async function GET() {
  const user = await getOrCreateUser();
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.userId))
    .orderBy(desc(orders.createdAt));

  const result = await Promise.all(
    userOrders.map(async (order) => {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.orderId, order.id));
      return { order, customer: customer ?? null };
    })
  );

  return NextResponse.json(result);
}
