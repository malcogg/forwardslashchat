import { NextResponse } from "next/server";
import { estimateSiteAgeTech } from "@/lib/roast";
import { getPageCountFromSitemap } from "@/lib/sitemap";
import { sanitizeWebsiteUrl, isValidUrl } from "@/lib/validation";
import { assertSafeOutboundHttpUrl } from "@/lib/url-safety";
import { checkAndIncrementRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

const FETCH_TIMEOUT_MS = 12_000;
const DELAY_BETWEEN_HOMEPAGE_AND_SITEMAP_MS = 200; // Polite — avoid back-to-back hits on small sites
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * POST /api/scan/roast
 * Lightweight homepage fetch + roast analysis. No Firecrawl credits.
 * Used in scan modal before signup.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIpFromRequest(request);
    const perMinute = Math.min(
      60,
      Math.max(5, Number(process.env.SCAN_ROAST_RATE_LIMIT_PER_MINUTE ?? 30))
    );
    const { ok } = await checkAndIncrementRateLimit({
      key: `scan_roast:${ip}`,
      limitPerMinute: perMinute,
    });
    if (!ok) {
      return NextResponse.json(
        { error: "Too many scans. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawUrl = (body as { url?: string }).url;
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const url = sanitizeWebsiteUrl(rawUrl);
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    if (!isValidUrl(normalized)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    try {
      assertSafeOutboundHttpUrl(normalized);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(normalized, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not fetch site", fallback: true },
        { status: 200 }
      );
    }

    const html = await res.text();
    if (!html || html.length < 50) {
      return NextResponse.json(
        { error: "Empty or minimal response", fallback: true },
        { status: 200 }
      );
    }

    const result = estimateSiteAgeTech(html, normalized);
    const linkBasedPages = result.estimatedPages ?? 0;

    // Brief pause before sitemap — polite crawler, avoid hammering small sites
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_HOMEPAGE_AND_SITEMAP_MS));

    // Full sitemap scan for accurate pricing — we charge for pages the bot will call
    const sitemapPages = await getPageCountFromSitemap(normalized);
    const estimatedPages =
      sitemapPages != null && sitemapPages > linkBasedPages
        ? sitemapPages
        : linkBasedPages || undefined;

    // Update reasons if we used sitemap (more comprehensive)
    let reasons = result.reasons;
    if (sitemapPages != null && sitemapPages > linkBasedPages) {
      reasons = [
        `Pages found: ~${sitemapPages} (sitemap scan)`,
        ...result.reasons.filter((r) => !r.startsWith("Pages found:")),
      ];
    }

    return NextResponse.json({
      ...result,
      reasons,
      estimatedPages: estimatedPages || result.estimatedPages,
      url: normalized.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      return NextResponse.json(
        { error: "Request timed out", fallback: true },
        { status: 200 }
      );
    }
    console.warn("Roast fetch error:", e);
    return NextResponse.json(
      { error: "Could not analyze site", fallback: true },
      { status: 200 }
    );
  }
}
