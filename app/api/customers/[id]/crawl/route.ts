import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, content, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

async function runFirecrawlCrawl(
  apiKey: string,
  url: string
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
    body: JSON.stringify({ url, limit: 50 }),
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
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

  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Crawl not configured" }, { status: 503 });
  }

  const url = customer.websiteUrl.startsWith("http")
    ? customer.websiteUrl
    : `https://${customer.websiteUrl}`;

  const result = await runFirecrawlCrawl(apiKey, url);
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

  await db
    .update(customers)
    .set({ status: "indexing", updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  return NextResponse.json({ success: true, pages: result.data.length });
}
