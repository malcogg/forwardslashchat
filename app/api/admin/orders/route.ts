import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * GET /api/admin/orders
 * List all orders with customers. Admin only.
 */
export async function GET() {
  const { sessionClaims } = await auth();
  const email = (sessionClaims?.email as string)?.toLowerCase();
  if (!isAdmin(email)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const database = db;
  const allOrders = await database
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  const result = await Promise.all(
    allOrders.map(async (order) => {
      const [customer] = await database
        .select()
        .from(customers)
        .where(eq(customers.orderId, order.id));
      return { order, customer: customer ?? null };
    })
  );

  return NextResponse.json(result);
}

/**
 * POST /api/admin/orders
 * Create order + customer (no payment). Admin only. For testing.
 * Body: { websiteUrl, businessName, domain, subdomain? }
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser();
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { sessionClaims } = await auth();
  const email = (sessionClaims?.email as string)?.toLowerCase();
  if (!isAdmin(email)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const { websiteUrl, businessName, domain, subdomain } = body as {
    websiteUrl?: string;
    businessName?: string;
    domain?: string;
    subdomain?: string;
  };

  if (!websiteUrl || !businessName || !domain) {
    return NextResponse.json(
      { error: "Missing: websiteUrl, businessName, domain" },
      { status: 400 }
    );
  }

  const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;

  try {
    const [order] = await db
      .insert(orders)
      .values({
        userId: user.userId,
        amountCents: 0,
        bundleYears: 1,
        dnsHelp: false,
        status: "paid",
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
        subdomain: subdomain ?? "chat",
        websiteUrl: url,
        prepaidUntil,
        status: "content_collection",
      })
      .returning();

    return NextResponse.json({ order, customer });
  } catch (e) {
    console.error("Admin order creation error:", e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
