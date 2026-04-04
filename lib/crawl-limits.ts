/**
 * Single source of truth for how many pages we *request* from Firecrawl per customer crawl.
 * Aligns manual POST /api/customers/[id]/crawl, autoCrawlCustomer, and job payload caps.
 */

const DEFAULT_ESTIMATE_WHEN_MISSING = 50;
const ABSOLUTE_MAX = 500;

/** Max pages we ever send as Firecrawl `limit` (operator / cost control). */
export function getOperatorCrawlCap(): number {
  const raw = process.env.FIRECRAWL_CRAWL_PAGE_MAX ?? process.env.AUTO_CRAWL_MAX_PAGES ?? String(ABSOLUTE_MAX);
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1) return ABSOLUTE_MAX;
  return Math.min(ABSOLUTE_MAX, Math.max(1, n));
}

/**
 * Target page count from checkout / scan (`customers.estimated_pages`), clamped to product limits.
 */
export function resolveCrawlPageLimit(estimatedPages: number | null | undefined): number {
  const est = estimatedPages == null || !Number.isFinite(Number(estimatedPages)) ? DEFAULT_ESTIMATE_WHEN_MISSING : Number(estimatedPages);
  return Math.min(ABSOLUTE_MAX, Math.max(1, Math.round(est)));
}

/**
 * Final Firecrawl `limit`: min(customer plan, operator cap, optional job/admin override).
 */
export function resolveEffectiveCrawlLimit(
  estimatedPages: number | null | undefined,
  jobOrAdminMaxPages?: number | null
): number {
  const fromCustomer = resolveCrawlPageLimit(estimatedPages);
  const cap = getOperatorCrawlCap();
  const fromPayload =
    jobOrAdminMaxPages != null && Number.isFinite(Number(jobOrAdminMaxPages))
      ? Math.min(ABSOLUTE_MAX, Math.max(1, Math.round(Number(jobOrAdminMaxPages))))
      : ABSOLUTE_MAX;
  return Math.min(fromCustomer, cap, fromPayload);
}
