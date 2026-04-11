import { getPriceFromPagesAndYears } from "@/lib/pricing";
import {
  computeCheckoutAmountCents,
  type CheckoutAddOnId,
  type CheckoutPlanSlug,
} from "@/lib/checkout-pricing";

const WEBSITE_BASE_USD: Record<string, number> = {
  starter: 350,
  "new-build": 1000,
  redesign: 2000,
};

const WEBSITE_ADDON_USD: Partial<Record<CheckoutAddOnId, number>> = {
  dns: 99,
  "social-media": 599,
};

/**
 * Best-effort total USD for the unpaid "Complete payment" CTA (matches checkout math when possible).
 */
export function getUnpaidOrderQuoteDollars(input: {
  isWebsiteOrder: boolean;
  planSlug: string | null | undefined;
  addOns: string[] | null | undefined;
  bundleYears: number | null | undefined;
  estimatedPages: number;
}): number | null {
  const { isWebsiteOrder, planSlug, addOns, bundleYears, estimatedPages } = input;
  const addonList = (addOns ?? []) as CheckoutAddOnId[];

  if (isWebsiteOrder) {
    if (!planSlug || WEBSITE_BASE_USD[planSlug] == null) return null;
    let total = WEBSITE_BASE_USD[planSlug];
    for (const id of addonList) {
      const add = WEBSITE_ADDON_USD[id];
      if (add != null) total += add;
    }
    return total;
  }

  const pages = Math.min(499, Math.max(1, Math.round(estimatedPages)));
  const years: 1 | 2 = (bundleYears ?? 2) <= 1 ? 1 : 2;

  let slug: CheckoutPlanSlug = "chatbot-2y";
  if (planSlug === "starter-bot") slug = "starter-bot";
  else if (planSlug === "chatbot-1y" || (planSlug == null && years === 1)) slug = "chatbot-1y";
  else if (planSlug === "chatbot-2y" || planSlug == null) slug = "chatbot-2y";

  try {
    const { amountCents } = computeCheckoutAmountCents({
      planSlug: slug,
      addOns: addonList,
      pages: slug === "starter-bot" ? 5 : pages,
    });
    return amountCents / 100;
  } catch {
    if (slug === "starter-bot") return 129;
    const p = getPriceFromPagesAndYears(pages, years);
    return p ?? null;
  }
}
