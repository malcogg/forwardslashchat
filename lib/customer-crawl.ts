import { db } from "@/db";
import { content, customers, orders, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { CrawlCompleteEmail } from "@/components/emails/crawl-complete";
import { DnsInstructionsEmail } from "@/components/emails/dns-instructions";
import { assertSafeOutboundHttpUrl } from "@/lib/url-safety";

async function runFirecrawlCrawl(apiKey: string, url: string, limit: number): Promise<{
  success: boolean;
  data?: { markdown?: string; metadata?: { sourceURL?: string; title?: string } }[];
  error?: string;
}> {
  const start = await fetchWithRetry("https://api.firecrawl.dev/v2/crawl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, limit }),
    timeoutMs: 15_000,
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 7_000,
    allowNonIdempotentRetry: true,
    logTag: "firecrawl-start",
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

    const statusRes = await fetchWithRetry(`https://api.firecrawl.dev/v2/crawl/${startJson.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeoutMs: 10_000,
      maxAttempts: 3,
      baseDelayMs: 400,
      maxDelayMs: 3_000,
      logTag: "firecrawl-status",
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

export async function autoCrawlCustomer(input: {
  customerId: string;
  notifyEmail?: string | null;
  reason?: "payment" | "manual";
  maxPages?: number;
}): Promise<{ ok: boolean; pages: number; skipped?: boolean; error?: string }> {
  if (!db) return { ok: false, pages: 0, error: "Database not configured" };

  const [customer] = await db.select().from(customers).where(eq(customers.id, input.customerId));
  if (!customer) return { ok: false, pages: 0, error: "Customer not found" };

  const [order] = await db.select().from(orders).where(eq(orders.id, customer.orderId));
  if (!order) return { ok: false, pages: 0, error: "Order not found" };

  // Only fulfill paid orders automatically.
  const paid = order.status === "paid" || order.status === "processing" || order.status === "delivered";
  if (!paid) return { ok: false, pages: 0, error: "Payment required" };

  // If we already have content, don't spend credits again.
  const [existing] = await db
    .select({ cnt: count() })
    .from(content)
    .where(eq(content.customerId, customer.id));
  const existingCount = Number(existing?.cnt ?? 0);
  if (existingCount > 0) return { ok: true, pages: existingCount, skipped: true };

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { ok: false, pages: 0, error: "Crawl not configured" };

  const url = customer.websiteUrl.startsWith("http") ? customer.websiteUrl : `https://${customer.websiteUrl}`;
  try {
    assertSafeOutboundHttpUrl(url);
  } catch {
    return { ok: false, pages: 0, error: "Website URL is not allowed" };
  }

  const hardCap = Math.min(500, Math.max(1, Number(input.maxPages ?? 200)));
  const requested = Math.min(Math.max(customer.estimatedPages ?? 50, 1), 500);
  const crawlLimit = Math.min(requested, hardCap);

  // Mark as crawling (best-effort)
  await db
    .update(customers)
    .set({ status: "crawling", updatedAt: new Date() })
    .where(eq(customers.id, customer.id));

  const result = await runFirecrawlCrawl(apiKey, url, crawlLimit);
  if (!result.success || !result.data) {
    return { ok: false, pages: 0, error: result.error ?? "Crawl failed" };
  }

  // Replace content
  await db.delete(content).where(eq(content.customerId, customer.id));
  for (const page of result.data) {
    const markdown = page.markdown ?? "";
    const sourceUrl = page.metadata?.sourceURL ?? "";
    const title = (page.metadata?.title ?? (sourceUrl ? new URL(sourceUrl).pathname : "")) || "Page";
    if (!markdown && !sourceUrl) continue;

    await db.insert(content).values({
      customerId: customer.id,
      url: sourceUrl,
      title,
      content: markdown || "(No content extracted)",
      description: markdown.slice(0, 200) || null,
    });
  }

  const pagesCrawled = result.data.length;
  const now = new Date();
  await db
    .update(customers)
    .set({ status: "dns_setup", updatedAt: now, lastCrawledAt: now })
    .where(eq(customers.id, customer.id));

  // Notify user (best-effort). If order has a userId, use it; otherwise fall back to webhook email.
  const toEmail = input.notifyEmail ?? null;
  if (resend && toEmail) {
    let firstName: string | undefined;
    if (order.userId) {
      const [userRow] = await db.select().from(users).where(eq(users.id, order.userId));
      firstName = userRow?.name?.split(" ")[0] ?? undefined;
    }
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
          chatUrl: `${chatBase}/chat/c/${customer.id}`,
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
      console.error("[auto-crawl] email failed:", e);
    }
  }

  return { ok: true, pages: pagesCrawled };
}

