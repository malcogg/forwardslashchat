import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, content } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/me
 * Returns current user's orders with customers (for sidebar, site list).
 */
export async function GET(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const database = db;
  const userOrders = await database
    .select()
    .from(orders)
    .where(eq(orders.userId, user.userId))
    .orderBy(desc(orders.createdAt));

  const result = await Promise.all(
    userOrders.map(async (order) => {
      const [customer] = await database
        .select()
        .from(customers)
        .where(eq(customers.orderId, order.id));
      let contentCount = 0;
      if (customer) {
        const [c] = await database
          .select({ count: count() })
          .from(content)
          .where(eq(content.customerId, customer.id));
        contentCount = c?.count ?? 0;
      }
      return {
        order,
        customer: customer ?? null,
        contentCount,
        estimatedPages: customer?.estimatedPages ?? 25,
      };
    })
  );

  return NextResponse.json(result);
}
