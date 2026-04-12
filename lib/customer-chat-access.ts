import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export type PaidCustomerResult =
  | { ok: true; customer: typeof customers.$inferSelect; order: typeof orders.$inferSelect }
  | { ok: false; reason: "no_db" | "not_found" | "payment_required" };

/**
 * Customer chat and related public APIs only apply to paid (or processing/delivered) orders.
 */
export async function getPaidCustomerForChat(customerId: string): Promise<PaidCustomerResult> {
  if (!db) return { ok: false, reason: "no_db" };
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) return { ok: false, reason: "not_found" };
  const [order] = await db.select().from(orders).where(eq(orders.id, customer.orderId));
  const paid =
    order?.status === "paid" || order?.status === "delivered" || order?.status === "processing";
  if (!order || !paid) return { ok: false, reason: "payment_required" };
  return { ok: true, customer, order };
}
