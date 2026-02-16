import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/chat/customer/[customerId]
 * Public: returns minimal customer info for chat page (businessName, primaryColor).
 * Used by /chat/c/[customerId] to render the chat UI.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;
  if (!customerId) {
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const [customer] = await db
    .select({ businessName: customers.businessName, primaryColor: customers.primaryColor })
    .from(customers)
    .where(eq(customers.id, customerId));

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
