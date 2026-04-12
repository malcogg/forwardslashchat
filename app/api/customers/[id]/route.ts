import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { sanitizeBusinessName, isValidUrl, LIMITS } from "@/lib/validation";

function stripControlChars(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * PATCH /api/customers/[id]
 * Update customer fields. Requires auth + ownership.
 * Body: { status?: "testing" | "delivered"; primaryColor?: "#rrggbb"; businessName?: string; logoUrl?: string | null }
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
  const { status, primaryColor, businessName, logoUrl } = body as {
    status?: string;
    primaryColor?: string;
    businessName?: string;
    logoUrl?: string | null;
  };

  const set: Partial<typeof customers.$inferInsert> = {};

  if (businessName !== undefined) {
    if (typeof businessName !== "string") {
      return NextResponse.json({ error: "Invalid businessName" }, { status: 400 });
    }
    const name = sanitizeBusinessName(businessName);
    if (!name) {
      return NextResponse.json({ error: "businessName cannot be empty" }, { status: 400 });
    }
    set.businessName = name;
  }

  if (logoUrl !== undefined) {
    if (logoUrl === null || logoUrl === "") {
      set.logoUrl = null;
    } else if (typeof logoUrl === "string") {
      const t = stripControlChars(logoUrl).trim().slice(0, LIMITS.websiteUrl);
      if (!t) {
        set.logoUrl = null;
      } else if (!isValidUrl(t)) {
        return NextResponse.json({ error: "Invalid logoUrl (use https://…)" }, { status: 400 });
      } else {
        set.logoUrl = t.startsWith("http") ? t : `https://${t}`;
      }
    } else {
      return NextResponse.json({ error: "Invalid logoUrl" }, { status: 400 });
    }
  }

  if (primaryColor !== undefined) {
    if (typeof primaryColor !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      return NextResponse.json({ error: "Invalid primaryColor (use #rrggbb)" }, { status: 400 });
    }
    set.primaryColor = primaryColor;
  }

  if (status !== undefined) {
    if (!["testing", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    set.status = status;
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db
    .update(customers)
    .set({ ...set, updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  return NextResponse.json({
    success: true,
    status: set.status,
    primaryColor: set.primaryColor,
    businessName: set.businessName,
    logoUrl: set.logoUrl,
  });
}
