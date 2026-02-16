import { NextResponse } from "next/server";
import { db } from "@/db";
import { scans } from "@/db/schema";

const CATEGORY_PATTERNS: { label: string; patterns: RegExp[] }[] = [
  { label: "Products", patterns: [/\/product/i, /\/shop/i, /\/store/i, /\/p\//, /\/item/i, /\/catalog/i] },
  { label: "Blog", patterns: [/\/blog/i, /\/post/i, /\/article/i, /\/news/i, /\/journal/i] },
  { label: "Landing pages", patterns: [/\/landing/i, /\/lp\//, /\/offer/i, /\/campaign/i] },
  { label: "Services", patterns: [/\/service/i, /\/pricing/i, /\/plans/i, /\/solutions/i] },
  { label: "About/Contact", patterns: [/\/about/i, /\/contact/i, /\/team/i, /\/faq/i, /\/help/i] },
];

function categorizeUrl(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    for (const { label, patterns } of CATEGORY_PATTERNS) {
      if (patterns.some((p) => p.test(path))) return label;
    }
  } catch {
    /* invalid URL */
  }
  return "Other";
}

async function runFirecrawlCrawl(apiKey: string, url: string): Promise<{ success: boolean; data?: { metadata?: { sourceURL?: string } }[]; error?: string }> {
  const start = await fetch("https://api.firecrawl.dev/v2/crawl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, limit: 50 }), // Lower limit = fewer credits; increase when you upgrade plan
  });

  const startJson = (await start.json()) as { success?: boolean; id?: string; error?: string };
  if (!startJson.success || !startJson.id) {
    const msg = typeof startJson.error === "string" ? startJson.error : "Could not start scan";
    return { success: false, error: msg };
  }

  const maxWait = 180; // 3 minutes
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
      data?: { metadata?: { sourceURL?: string } }[];
      error?: string;
    };

    if (!status.success) return { success: false, error: status.error ?? "Scan error" };
    if (status.status === "failed") return { success: false, error: status.error ?? "Crawl failed" };
    if (status.status === "completed" && Array.isArray(status.data)) {
      return { success: true, data: status.data };
    }
  }

  return { success: false, error: "Scan timed out. Try a smaller site or try again." };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalized = url.replace(/\/$/, "").replace(/^(?!https?:\/\/)/, "https://");
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Scan service not configured. Set FIRECRAWL_API_KEY." },
        { status: 503 }
      );
    }

    // Check if we already have content for this URL (saves Firecrawl credits)
    if (db) {
      const { customers, content } = await import("@/db/schema");
      const { eq, count } = await import("drizzle-orm");
      let host: string;
      try {
        host = new URL(normalized).hostname.replace(/^www\./, "");
      } catch {
        host = "";
      }
      if (host) {
        const allCustomers = await db.select().from(customers);
        const matching = allCustomers.find((c) => {
          try {
            const cHost = new URL(c.websiteUrl.startsWith("http") ? c.websiteUrl : `https://${c.websiteUrl}`).hostname.replace(/^www\./, "");
            return cHost === host;
          } catch {
            return false;
          }
        });
        if (matching) {
          const [row] = await db
            .select({ cnt: count() })
            .from(content)
            .where(eq(content.customerId, matching.id));
          const pageCount = Number(row?.cnt ?? 0);
          if (pageCount > 0) {
            return NextResponse.json({
              pageCount,
              categories: [{ label: "Pages", count: pageCount }],
              url: normalized.replace(/^https?:\/\//, "").replace(/\/$/, ""),
              fromCache: true,
            });
          }
        }
      }
    }

    const crawl = await runFirecrawlCrawl(apiKey, normalized);

    if (!crawl.success || !crawl.data) {
      const msg = crawl.error ?? "Scan failed. Please check the URL and try again.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const pages = crawl.data;
    const pageCount = pages.length;

    const categoryCounts = new Map<string, number>();
    categoryCounts.set("Products", 0);
    categoryCounts.set("Blog", 0);
    categoryCounts.set("Landing pages", 0);
    categoryCounts.set("Services", 0);
    categoryCounts.set("About/Contact", 0);
    categoryCounts.set("Other", 0);

    for (const page of pages) {
      const source = page.metadata?.sourceURL ?? "";
      const cat = categorizeUrl(source);
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    const categories = Array.from(categoryCounts.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    if (categories.length === 0) {
      categories.push({ label: "Pages", count: pageCount });
    }

    const displayUrl = normalized.replace(/^https?:\/\//, "").replace(/\/$/, "");
    let scanId: string | undefined;

    if (db) {
      try {
        const [row] = await db
          .insert(scans)
          .values({
            url: normalized,
            pageCount,
            categories,
          })
          .returning({ id: scans.id });
        scanId = row?.id;
      } catch (e) {
        console.warn("Failed to save scan to DB:", e);
      }
    }

    return NextResponse.json({
      pageCount,
      categories,
      url: displayUrl,
      scanId,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "Scan failed. Please try again." },
      { status: 500 }
    );
  }
}
