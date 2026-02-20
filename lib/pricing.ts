/**
 * AI Chatbot pricing — page-based tiers, 1 or 2 years.
 *
 * Up to 50 pages:    $799 (1yr), $1,099 (2yr)
 * 51–200 pages:      $1,499 (1yr), $2,099 (2yr)
 * 201–500 pages:     $2,999 (1yr), $3,999 (2yr)
 * 500+:              Contact us
 */

export const TIER_LABELS = {
  under50: "Up to 50 pages",
  "50-200": "51–200 pages",
  "200-500": "201–500 pages",
  "500+": "500+ pages",
} as const;

export type TierKey = keyof typeof TIER_LABELS;

export function getTierFromPages(pages: number): TierKey | null {
  if (pages <= 50) return "under50";
  if (pages <= 200) return "50-200";
  if (pages < 500) return "200-500";
  return "500+";
}

export function getPriceFromPagesAndYears(pages: number, years: 1 | 2): number | null {
  if (pages >= 500) return null; // Contact us
  if (years !== 1 && years !== 2) return null;

  if (pages <= 50) {
    return years === 1 ? 799 : 1099;
  }

  if (pages <= 200) {
    return years === 1 ? 1499 : 2099;
  }

  if (pages < 500) {
    return years === 1 ? 2999 : 3999;
  }

  return null;
}

export function getPriceForTier(
  pages: number,
  years: 1 | 2
): { price: number; tier: TierKey } | { price: null; tier: "500+"; contactUs: true } {
  const tier = getTierFromPages(pages);
  if (tier === "500+") {
    return { price: null, tier: "500+", contactUs: true };
  }
  const price = getPriceFromPagesAndYears(pages, years);
  return { price: price ?? 0, tier: tier! };
}
