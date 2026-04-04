import { db } from "@/db";
import { content, customers, orders, users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { CrawlCompleteEmail } from "@/components/emails/crawl-complete";
import { DnsInstructionsEmail } from "@/components/emails/dns-instructions";
import { assertSafeOutboundHttpUrl } from "@/lib/url-safety";
import { normalizeContentUrl, shouldKeepCrawledPage } from "@/lib/content-filter";
import { enqueueGoLiveForCustomer } from "@/lib/jobs";
import { resolveEffectiveCrawlLimit } from "@/lib/crawl-limits";
import { logCrawlFilterShortfall, logCrawlOutcome, runFirecrawlCrawl } from "@/lib/firecrawl-crawl";

export async function autoCrawlCustomer(input: {
  customerId: string;
  notifyEmail?: string | null;
  reason?: "payment" | "manual";
  /** Optional ceiling from job payload (admin); operator cap still applies via env. */
  maxPages?: number | null;
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
  if (existingCount > 0) {
    if (customer.status !== "delivered") {
      try {
        await enqueueGoLiveForCustomer(customer.id);
      } catch (e) {
        console.error("[auto-crawl] enqueue go-live failed (skipped crawl):", e);
      }
    }
    return { ok: true, pages: existingCount, skipped: true };
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return { ok: false, pages: 0, error: "Crawl not configured" };

  const url = customer.websiteUrl.startsWith("http") ? customer.websiteUrl : `https://${customer.websiteUrl}`;
  try {
    assertSafeOutboundHttpUrl(url);
  } catch {
    return { ok: false, pages: 0, error: "Website URL is not allowed" };
  }

  const crawlLimit = resolveEffectiveCrawlLimit(customer.estimatedPages, input.maxPages ?? null);

  // Mark as crawling (best-effort)
  await db
    .update(customers)
    .set({ status: "crawling", updatedAt: new Date() })
    .where(eq(customers.id, customer.id));

  const result = await runFirecrawlCrawl(apiKey, url, crawlLimit);
  if (!result.success || !result.data) {
    logCrawlOutcome({
      source: "auto_crawl_customer",
      customerId: customer.id,
      orderId: order.id,
      websiteUrl: url,
      requestedLimit: crawlLimit,
      rawPageCount: 0,
      storedPageCount: 0,
      crawlJobId: result.crawlJobId,
      error: result.error,
    });
    return { ok: false, pages: 0, error: result.error ?? "Crawl failed" };
  }

  const rawPageCount = result.data.length;

  // Replace content
  await db.delete(content).where(eq(content.customerId, customer.id));
  let pagesSaved = 0;
  for (const page of result.data) {
    const markdown = page.markdown ?? "";
    const sourceUrl = page.metadata?.sourceURL ?? "";
    const title = (page.metadata?.title ?? (sourceUrl ? new URL(sourceUrl).pathname : "")) || "Page";
    if (!markdown && !sourceUrl) continue;
    if (!shouldKeepCrawledPage({ sourceUrl, title, markdown })) continue;

    await db.insert(content).values({
      customerId: customer.id,
      url: normalizeContentUrl(sourceUrl),
      title,
      content: markdown || "(No content extracted)",
      description: markdown.slice(0, 200) || null,
    });
    pagesSaved++;
  }

  logCrawlOutcome({
    source: "auto_crawl_customer",
    customerId: customer.id,
    orderId: order.id,
    websiteUrl: url,
    requestedLimit: crawlLimit,
    rawPageCount,
    storedPageCount: pagesSaved,
    crawlJobId: result.crawlJobId,
  });
  logCrawlFilterShortfall({
    source: "auto_crawl_customer",
    customerId: customer.id,
    orderId: order.id,
    requestedLimit: crawlLimit,
    rawPageCount,
    storedPageCount: pagesSaved,
  });

  const pagesCrawled = pagesSaved;
  const now = new Date();
  await db
    .update(customers)
    .set({ status: "dns_setup", updatedAt: now, lastCrawledAt: now })
    .where(eq(customers.id, customer.id));

  // Notify user (best-effort): Stripe session email, else linked app user.
  let toEmail = input.notifyEmail ?? null;
  if (!toEmail && order.userId) {
    const [u] = await db.select().from(users).where(eq(users.id, order.userId));
    toEmail = u?.email ?? null;
  }
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

  try {
    await enqueueGoLiveForCustomer(customer.id);
  } catch (e) {
    console.error("[auto-crawl] enqueue go-live failed:", e);
  }

  return { ok: true, pages: pagesCrawled };
}

