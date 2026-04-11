import { isChatbotPlan, type CheckoutPlanSlug } from "@/lib/checkout-pricing";

/**
 * Soft hint when indexed pages are far below checkout `estimatedPages` (chatbot plans only).
 */
export function buildCrawlShortfallHint(input: {
  planSlug: string | null | undefined;
  estimatedPages: number | null | undefined;
  contentCount: number;
  customerStatus: string | undefined;
}): string | null {
  const slug = input.planSlug as CheckoutPlanSlug | undefined;
  if (!slug || !isChatbotPlan(slug)) return null;

  const raw = input.estimatedPages;
  const est =
    raw == null || !Number.isFinite(Number(raw)) ? null : Math.min(500, Math.max(1, Math.round(Number(raw))));
  if (est == null || est < 10) return null;

  const n = input.contentCount;
  if (n === 0) return null;
  if (input.customerStatus === "crawling") return null;

  const softCap = Math.min(est - 1, Math.max(5, Math.floor(est * 0.42)));
  if (n >= softCap) return null;

  return `You have ${n} page${n === 1 ? "" : "s"} indexed, but your plan targets about ${est}. If that seems low, try a rescan when your cooldown ends, or email hello@forwardslash.chat—we can help tune the crawl.`;
}
