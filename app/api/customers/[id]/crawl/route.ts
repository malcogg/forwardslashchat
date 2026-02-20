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

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

async function runFirecrawlCrawl(
  apiKey: string,
  url: string,
  limit = 50
): Promise<{
  success: boolean;
  data?: { markdown?: string; metadata?: { sourceURL?: string; title?: string } }[];
  error?: string;
}> {
  const start = await fetch("https://api.firecrawl.dev/v2/crawl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, limit }),
  });

  const startJson = (await start.json()) as { success?: boolean; id?: string; error?: string };
  if (!startJson.success || !startJson.id) {
    return { success: false, error: startJson.error ?? "Could not start crawl" };
  }

  const maxWait = 180;
  const pollInterval = 3;
  let elapsed = 0;

  while (elapsed < maxWait) {
    await new Promise((r) => setTimeout(r, pollInterval * 1000));
    elapsed += pollInterval;

    const statusRes = await fetch(`https://api.firecrawl.dev/v2/crawl/${startJson.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const status = (await statusRes.json()) as {
      success?: boolean;
      status?: string;
      data?: { markdown?: string; metadata?: { sourceURL?: string; title?: string } }[];
      error?: string;
    };

    if (!status.success) return { success: false, error: status.error ?? "Crawl error" };
    if (status.status === "failed") return { success: false, error: status.error ?? "Crawl failed" };
    if (status.status === "completed" && Array.isArray(status.data)) {
      return { success: true, data: status.data };
    }
  }

  return { success: false, error: "Crawl timed out" };
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
  const skipCredits = adminBypass || order.status === "paid";
  // Use purchased/estimated pages — we charge for what the bot will crawl (cap 500)
  const crawlLimit = Math.min(Math.max(customer.estimatedPages ?? 50, 1), 500);
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

  const result = await runFirecrawlCrawl(apiKey, url, crawlLimit);
  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error ?? "Crawl failed" }, { status: 500 });
  }

  // Delete existing content for this customer
  await db.delete(content).where(eq(content.customerId, customerId));

  // Insert new content
  for (const page of result.data) {
    const markdown = page.markdown ?? "";
    const sourceUrl = page.metadata?.sourceURL ?? "";
    const title =
      (page.metadata?.title ?? (sourceUrl ? new URL(sourceUrl).pathname : "")) || "Page";

    if (!markdown && !sourceUrl) continue;

    await db.insert(content).values({
      customerId,
      url: sourceUrl,
      title,
      content: markdown || "(No content extracted)",
      description: markdown.slice(0, 200) || null,
    });
  }

  const pagesCrawled = result.data.length;
  if (!skipCredits) {
    const deducted = await deductCredits(user.userId, pagesCrawled);
    if (!deducted.ok) {
      return NextResponse.json({ error: "Credit deduction failed" }, { status: 500 });
    }
  }

  const now = new Date();
  await db
    .update(customers)
    .set({ status: "dns_setup", updatedAt: now, lastCrawledAt: now })
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

  const remaining = skipCredits ? 9999 : (await getCreditBalance(user.userId)).remaining;
  return NextResponse.json({
    success: true,
    pages: pagesCrawled,
    creditsRemaining: remaining,
  });
}
