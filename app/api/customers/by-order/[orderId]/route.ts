import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/customers/by-order/[orderId]
 * Returns customer for an order. Requires auth + order ownership.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  }

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

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!order.userId || order.userId !== user.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.orderId, orderId));

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
