/**
 * Sitemap-based page count for accurate pricing.
 * Fetches sitemap.xml (or index), parses URLs, counts same-domain pages.
 */

import { assertSafeOutboundHttpUrl } from "@/lib/url-safety";

const SITEMAP_PATHS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/sitemap/sitemap_index.xml",
  "/post-sitemap.xml",
  "/page-sitemap.xml",
];

const FETCH_TIMEOUT_MS = 8_000;
const DELAY_BETWEEN_REQUESTS_MS = 250; // Polite crawler — avoid hammering small sites
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const MAX_CHILD_SITEMAPS = 5;
const MAX_URLS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseLocUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m;
  while ((m = locRegex.exec(xml)) !== null && urls.length < MAX_URLS) {
    const u = (m[1] || "").trim();
    if (u && u.startsWith("http")) urls.push(u);
  }
  return urls;
}

function parseSitemapIndexLoc(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>\s*([^<]+)\s*<\/loc>/gi;
  let m;
  while ((m = locRegex.exec(xml)) !== null) {
    const u = (m[1] || "").trim();
    if (u && (u.endsWith(".xml") || u.includes("sitemap"))) urls.push(u);
  }
  return urls;
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml,*/*" },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    clearTimeout(timeout);
    return "";
  }
}

export async function getPageCountFromSitemap(baseUrl: string): Promise<number | null> {
  let baseOrigin = "";
  try {
    const u = new URL(baseUrl);
    assertSafeOutboundHttpUrl(u.origin);
    baseOrigin = u.origin;
  } catch {
    return null;
  }

  const baseHost = baseOrigin.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const urls = new Set<string>();
  const sitemapUrlsToTry: string[] = [];

  let lastFetchAt = 0;
  const throttle = async () => {
    const now = Date.now();
    const elapsed = now - lastFetchAt;
    if (elapsed < DELAY_BETWEEN_REQUESTS_MS && lastFetchAt > 0) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS - elapsed);
    }
    lastFetchAt = Date.now();
  };

  // Check robots.txt for Sitemap: directive
  await throttle();
  const robotsTxt = await fetchWithTimeout(`${baseOrigin}/robots.txt`);
  if (robotsTxt) {
    const sitemapMatch = robotsTxt.match(/Sitemap:\s*(\S+)/gi);
    if (sitemapMatch) {
      for (const line of sitemapMatch) {
        const u = line.replace(/^Sitemap:\s*/i, "").trim();
        if (u && u.startsWith("http")) sitemapUrlsToTry.push(u);
      }
    }
  }

  // Common sitemap paths
  for (const path of SITEMAP_PATHS) {
    sitemapUrlsToTry.push(`${baseOrigin}${path}`);
  }

  for (const sitemapUrl of sitemapUrlsToTry) {
    await throttle();
    const xml = await fetchWithTimeout(sitemapUrl);
    if (!xml || xml.length < 50) continue;

    // Check if it's a sitemap index (links to other sitemaps)
    const isIndex = /<sitemapindex/i.test(xml) || /sitemap.*index/i.test(xml);
    if (isIndex) {
      const childUrls = parseSitemapIndexLoc(xml);
      for (let i = 0; i < Math.min(childUrls.length, MAX_CHILD_SITEMAPS); i++) {
        await throttle();
        const childXml = await fetchWithTimeout(childUrls[i]);
        if (childXml) {
          const locs = parseLocUrls(childXml);
          for (const loc of locs) {
            try {
              const parsed = new URL(loc);
              const host = parsed.hostname.replace(/^www\./, "");
              if (host === baseHost || host.endsWith(`.${baseHost}`)) {
                const normalized = (parsed.pathname || "/").replace(/\/$/, "") || "/";
                urls.add(normalized);
                if (urls.size >= MAX_URLS) break;
              }
            } catch {
              /* skip */
            }
          }
        }
        if (urls.size >= MAX_URLS) break;
      }
    } else {
      const locs = parseLocUrls(xml);
      for (const loc of locs) {
        try {
          const parsed = new URL(loc);
          const host = parsed.hostname.replace(/^www\./, "");
          if (host === baseHost || host.endsWith(`.${baseHost}`)) {
            const normalized = (parsed.pathname || "/").replace(/\/$/, "") || "/";
            urls.add(normalized);
            if (urls.size >= MAX_URLS) break;
          }
        } catch {
          /* skip */
        }
      }
    }

    if (urls.size > 0) {
      return Math.min(urls.size, MAX_URLS);
    }
  }

  return null;
}
