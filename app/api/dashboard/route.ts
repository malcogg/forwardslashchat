import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, content, jobs, customerChatLeads, userOnboarding } from "@/db/schema";
import { eq, desc, count, inArray, and, gte } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { buildCrawlShortfallHint } from "@/lib/crawl-coverage-hint";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard?orderId=xxx
 * Returns order + customer for the signed-in user. No payment required to load dashboard.
 * - Any signed-in user can reach the dashboard (paid or not).
 * - If orderId: load that order, link to user if unclaimed, validate ownership
 * - If no orderId: return user's first order (or empty). New users get { order: null, customer: null }.
 */
export async function GET(request: Request) {
  try {
    const user = await getOrCreateUser(request);
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    // When DB not configured or user not in DB yet, return empty dashboard (allows "Get started" UX)
    if (!db || !user.userId) {
      return NextResponse.json({ order: null, customer: null, onboarding: null });
    }

    const [onboardingRow] = await db
      .select({
        websiteUrlSnapshot: userOnboarding.websiteUrlSnapshot,
        dnsHelpPreference: userOnboarding.dnsHelpPreference,
        hasExistingAiChat: userOnboarding.hasExistingAiChat,
      })
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, user.userId));

    const onboardingPayload =
      onboardingRow != null
        ? {
            websiteUrlSnapshot: onboardingRow.websiteUrlSnapshot,
            dnsHelpPreference: onboardingRow.dnsHelpPreference,
            hasExistingAiChat: onboardingRow.hasExistingAiChat,
          }
        : null;

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
    return NextResponse.json({ order: null, customer: null, onboarding: onboardingPayload });
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.orderId, order.id));

  let contentCount = 0;
  if (customer) {
    const [c] = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.customerId, customer.id));
    contentCount = c?.count ?? 0;
  }

  const automationJobs = customer
    ? await db
        .select({
          type: jobs.type,
          status: jobs.status,
          lastError: jobs.lastError,
          attempts: jobs.attempts,
          maxAttempts: jobs.maxAttempts,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
          dedupeKey: jobs.dedupeKey,
        })
        .from(jobs)
        .where(
          inArray(jobs.dedupeKey, [`auto_crawl_${order.id}`, `go_live_${customer.id}`])
        )
    : [];

  const crawlShortfallHint =
    customer && order
      ? buildCrawlShortfallHint({
          planSlug: order.planSlug,
          estimatedPages: customer.estimatedPages,
          contentCount,
          customerStatus: customer.status,
        })
      : null;

  let visitorLeads: {
    total90d: number;
    recent: { id: string; firstName: string | null; email: string | null; phone: string | null; createdAt: Date }[];
  } | null = null;

  if (customer) {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const [totalRow] = await db
      .select({ count: count() })
      .from(customerChatLeads)
      .where(
        and(
          eq(customerChatLeads.customerId, customer.id),
          eq(customerChatLeads.skipped, false),
          gte(customerChatLeads.createdAt, since)
        )
      );
    const recent = await db
      .select({
        id: customerChatLeads.id,
        firstName: customerChatLeads.firstName,
        email: customerChatLeads.email,
        phone: customerChatLeads.phone,
        createdAt: customerChatLeads.createdAt,
      })
      .from(customerChatLeads)
      .where(
        and(
          eq(customerChatLeads.customerId, customer.id),
          eq(customerChatLeads.skipped, false),
          gte(customerChatLeads.createdAt, since)
        )
      )
      .orderBy(desc(customerChatLeads.createdAt))
      .limit(20);
    visitorLeads = {
      total90d: Number(totalRow?.count ?? 0),
      recent,
    };
  }

  return NextResponse.json({
    order,
    customer: customer ?? null,
    contentCount,
    automationJobs,
    crawlShortfallHint,
    visitorLeads,
    onboarding: onboardingPayload,
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dashboard] Error:", msg);
    return NextResponse.json({ error: msg || "Dashboard error" }, { status: 500 });
  }
}
