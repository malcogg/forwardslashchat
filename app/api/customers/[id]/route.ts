import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

/**
 * PATCH /api/customers/[id]
 * Update customer fields. Requires auth + ownership.
 * Body: { status?: "testing" | "delivered"; primaryColor?: "#rrggbb" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: customerId } = await params;
  if (!customerId || !db) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, customer.orderId));
  if (!order || order.userId !== user.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { status, primaryColor } = body as { status?: string; primaryColor?: string };

  if (primaryColor === undefined && status === undefined) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  if (primaryColor !== undefined) {
    if (typeof primaryColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return NextResponse.json({ error: "Invalid primaryColor (use #rrggbb)" }, { status: 400 });
    }
    await db
      .update(customers)
      .set({ primaryColor, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
    if (status === undefined) {
      return NextResponse.json({ success: true, primaryColor });
    }
  }

  if (status !== undefined) {
    if (!["testing", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await db
      .update(customers)
      .set({ status, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  return NextResponse.json({ success: true, status, primaryColor });
}
