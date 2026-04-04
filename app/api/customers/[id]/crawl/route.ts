import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, content, orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { getCreditBalance, deductCredits } from "@/lib/credits";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { CrawlCompleteEmail } from "@/components/emails/crawl-complete";
import { DnsInstructionsEmail } from "@/components/emails/dns-instructions";
import { assertSafeOutboundHttpUrl } from "@/lib/url-safety";
import { normalizeContentUrl, shouldKeepCrawledPage } from "@/lib/content-filter";
import { deductRescanCredits, getRescanCreditsBalance } from "@/lib/credit-balance";
import { enqueueGoLiveForCustomer } from "@/lib/jobs";
import { resolveEffectiveCrawlLimit } from "@/lib/crawl-limits";
import { logCrawlFilterShortfall, logCrawlOutcome, runFirecrawlCrawl } from "@/lib/firecrawl-crawl";
import {
  crawlProgressNow,
  createCrawlProgressPollerWriter,
  setCustomerCrawlProgress,
} from "@/lib/crawl-progress";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * POST /api/customers/[id]/crawl
 * Crawl customer's website and save content for chat. Requires auth + ownership.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser(req);
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

  // No crawl before payment (admins bypass)
  const { sessionClaims } = await auth();
  const userEmail = sessionClaims?.email as string | undefined;
  const adminBypass = isAdmin(userEmail);
  if (!adminBypass && order.status !== "paid") {
    return NextResponse.json(
      { error: "Payment required to run the scan. Complete checkout first.", paymentRequired: true },
      { status: 402 }
    );
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Crawl not configured" }, { status: 503 });
  }

  // 7-day rescan cooldown for paid users (admins bypass)
  const RESCAN_COOLDOWN_DAYS = 7;
  const isPaid = order?.status === "paid";
  const lastCrawled = customer.lastCrawledAt ? new Date(customer.lastCrawledAt) : null;
  const nextCrawlAvailable = lastCrawled
    ? new Date(lastCrawled.getTime() + RESCAN_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const canRescan = !lastCrawled || !nextCrawlAvailable || new Date() >= nextCrawlAvailable;

  if (isPaid && !canRescan) {
    return NextResponse.json(
      {
        error: `Rescan available in ${Math.ceil((nextCrawlAvailable!.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days. Last scanned: ${lastCrawled!.toLocaleDateString()}.`,
        lastCrawledAt: customer.lastCrawledAt,
        nextCrawlAvailable: nextCrawlAvailable?.toISOString(),
      },
      { status: 429 }
    );
  }

  // Credit check: skip for paid orders and admins (paid customers get crawl as part of their purchase)
  const isRescan = !!customer.lastCrawledAt;
  // Initial build is included for paid orders; rescans require credits.
  const enforceRescanCredits = !adminBypass && order.status === "paid" && isRescan;
  const skipCredits = adminBypass || (order.status === "paid" && !enforceRescanCredits);
  const crawlLimit = resolveEffectiveCrawlLimit(customer.estimatedPages, null);

  if (enforceRescanCredits) {
    const bal = await getRescanCreditsBalance(user.userId);
    if (bal < crawlLimit) {
      return NextResponse.json(
        {
          error: `Rescan requires credits. Need ~${crawlLimit}, have ${bal}.`,
          creditsRequired: crawlLimit,
          creditsBalance: bal,
          purchaseEndpoint: "/api/credits/checkout",
        },
        { status: 402 }
      );
    }
  }

  if (!skipCredits) {
    const creditsNeeded = crawlLimit;
    const balance = await getCreditBalance(user.userId);
    if (balance.remaining < creditsNeeded) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Need ${creditsNeeded}, have ${balance.remaining}. Limit: ${balance.creditsLimit} (crawl uses ~${crawlLimit} credits)`,
        },
        { status: 402 }
      );
    }
  }

  const url = customer.websiteUrl.startsWith("http")
    ? customer.websiteUrl
    : `https://${customer.websiteUrl}`;
  try {
    assertSafeOutboundHttpUrl(url);
  } catch {
    return NextResponse.json(
      { error: "Website URL is not allowed" },
      { status: 400 }
    );
  }

  const prevStatus = customer.status;
  await db
    .update(customers)
    .set({
      status: "crawling",
      crawlProgress: crawlProgressNow({
        phase: "starting",
        source: "manual_api",
        requestedLimit: crawlLimit,
      }),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId));

  const onPoll = createCrawlProgressPollerWriter(customerId, "manual_api", crawlLimit);
  const result = await runFirecrawlCrawl(apiKey, url, crawlLimit, { onProgress: onPoll });
  if (!result.success || !result.data) {
    logCrawlOutcome({
      source: "manual_api",
      customerId,
      orderId: order.id,
      websiteUrl: url,
      requestedLimit: crawlLimit,
      rawPageCount: 0,
      storedPageCount: 0,
      crawlJobId: result.crawlJobId,
      error: result.error,
    });
    await setCustomerCrawlProgress(
      customerId,
      crawlProgressNow({
        phase: "failed",
        source: "manual_api",
        requestedLimit: crawlLimit,
        error: result.error ?? "Crawl failed",
        firecrawlJobId: result.crawlJobId,
      })
    );
    await db
      .update(customers)
      .set({ status: prevStatus, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
    return NextResponse.json({ error: result.error ?? "Crawl failed" }, { status: 500 });
  }

  const rawPageCount = result.data.length;

  await setCustomerCrawlProgress(
    customerId,
    crawlProgressNow({
      phase: "saving",
      source: "manual_api",
      requestedLimit: crawlLimit,
      firecrawlJobId: result.crawlJobId,
    })
  );

  // Delete existing content for this customer
  await db.delete(content).where(eq(content.customerId, customerId));

  // Insert new content (filter out junk URLs/content)
  let pagesSaved = 0;
  for (const page of result.data) {
    const markdown = page.markdown ?? "";
    const sourceUrl = page.metadata?.sourceURL ?? "";
    const title =
      (page.metadata?.title ?? (sourceUrl ? new URL(sourceUrl).pathname : "")) || "Page";

    if (!markdown && !sourceUrl) continue;
    if (!shouldKeepCrawledPage({ sourceUrl, title, markdown })) continue;

    await db.insert(content).values({
      customerId,
      url: normalizeContentUrl(sourceUrl),
      title,
      content: markdown || "(No content extracted)",
      description: markdown.slice(0, 200) || null,
    });
    pagesSaved++;
  }

  logCrawlOutcome({
    source: "manual_api",
    customerId,
    orderId: order.id,
    websiteUrl: url,
    requestedLimit: crawlLimit,
    rawPageCount,
    storedPageCount: pagesSaved,
    crawlJobId: result.crawlJobId,
  });
  logCrawlFilterShortfall({
    source: "manual_api",
    customerId,
    orderId: order.id,
    requestedLimit: crawlLimit,
    rawPageCount,
    storedPageCount: pagesSaved,
  });

  const pagesCrawled = pagesSaved;
  if (enforceRescanCredits) {
    const deducted = await deductRescanCredits({ userId: user.userId, amount: pagesCrawled, reason: "rescan" });
    if (!deducted.ok) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
  } else if (!skipCredits) {
    const deducted = await deductCredits(user.userId, pagesCrawled);
    if (!deducted.ok) {
      return NextResponse.json({ error: "Credit deduction failed" }, { status: 500 });
    }
  }

  const now = new Date();
  await db
    .update(customers)
    .set({
      status: "dns_setup",
      updatedAt: now,
      lastCrawledAt: now,
      crawlProgress: null,
    })
    .where(eq(customers.id, customerId));

  // Send crawl complete + DNS instructions emails
  if (resend && user?.userId) {
    const [userRow] = await db.select().from(users).where(eq(users.id, user.userId));
    const toEmail = userRow?.email ?? user.email;
    const firstName = userRow?.name?.split(" ")[0] ?? undefined;
    if (toEmail) {
      try {
        const chatBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://forwardslash.chat";
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [toEmail],
          subject: "Your chatbot content is ready",
          react: CrawlCompleteEmail({
            firstName,
            businessName: customer.businessName,
            domain: customer.domain,
            subdomain: customer.subdomain,
            websiteUrl: customer.websiteUrl,
            pagesCrawled,
            chatUrl: `${chatBase}/chat/c/${customerId}`,
          }),
        });
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [toEmail],
          subject: "Add this CNAME to go live",
          react: DnsInstructionsEmail({
            firstName,
            businessName: customer.businessName,
            domain: customer.domain,
            subdomain: customer.subdomain,
          }),
        });
      } catch (e) {
        console.error("Crawl/DNS email failed:", e);
      }
    }
  }

  try {
    await enqueueGoLiveForCustomer(customerId);
  } catch (e) {
    console.error("[crawl] enqueue go-live failed:", e);
  }

  const remaining = skipCredits ? 9999 : (await getCreditBalance(user.userId)).remaining;
  const rescanCreditsRemaining = await getRescanCreditsBalance(user.userId);
  return NextResponse.json({
    success: true,
    pages: pagesCrawled,
    creditsRemaining: remaining,
    rescanCreditsRemaining,
  });
}
