import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { enqueueOrKickJob, getJobByDedupeKey } from "@/lib/jobs";
import { verifyCustomerCname } from "@/lib/go-live";

/**
 * POST /api/customers/[id]/go-live
 * Enqueue a background "go live" job:
 * 1) Verify customer CNAME points to our target (retries until DNS propagates)
 * 2) Add domain to Vercel via API
 * 3) Set customer status to delivered
 */
export async function POST(
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

  // Vercel API must be configured for automation.
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return NextResponse.json(
      {
        error:
          "Vercel API not configured. Add VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID. See docs/VERCEL-DOMAIN-AUTOMATION-SETUP.md",
      },
      { status: 503 }
    );
  }

  await enqueueOrKickJob({
    type: "go_live_domain",
    dedupeKey: `go_live_${customerId}`,
    payload: { customerId },
    maxAttempts: 30,
  });

  // Keep customer in dns_setup until attached.
  if (customer.status !== "dns_setup" && customer.status !== "delivered") {
    await db
      .update(customers)
      .set({ status: "dns_setup", updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  return NextResponse.json({ queued: true }, { status: 202 });
}

/**
 * GET /api/customers/[id]/go-live
 * Returns current customer status + job state for the "go live" automation.
 */
export async function GET(
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

  const job = await getJobByDedupeKey(`go_live_${customerId}`);
  const customDomain = `${customer.subdomain}.${customer.domain}`;

  const url = new URL(request.url);
  const dnsProbe = url.searchParams.get("dnsProbe") === "1";
  const dnsCheck = dnsProbe ? await verifyCustomerCname(customDomain) : undefined;

  return NextResponse.json({
    customerStatus: customer.status,
    domain: customDomain,
    job: job
      ? {
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          lastError: job.lastError,
          updatedAt: job.updatedAt,
        }
      : null,
    ...(dnsCheck != null ? { dnsCheck } : {}),
  });
}
