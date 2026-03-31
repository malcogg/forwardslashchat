import { getPriceFromPagesAndYears } from "@/lib/pricing";

export type CheckoutPlanSlug =
  | "starter-bot"
  | "chatbot-1y"
  | "chatbot-2y"
  | "starter"
  | "new-build"
  | "redesign";

export type CheckoutAddOnId =
  | "dns"
  | "starter"
  | "new-build"
  | "redesign"
  | "social-media";

const WEBSITE_PLAN_PRICES: Record<Exclude<CheckoutPlanSlug, "starter-bot" | "chatbot-1y" | "chatbot-2y">, number> = {
  starter: 350,
  "new-build": 1000,
  redesign: 2000,
};

const FIXED_PLAN_PRICES: Record<"starter-bot", number> = {
  "starter-bot": 129,
};

const ADD_ON_PRICES: Record<CheckoutAddOnId, number> = {
  dns: 99,
  starter: 350,
  "new-build": 1000,
  redesign: 2000,
  "social-media": 599,
};

const ADD_ONS_FOR_CHATBOT = new Set<CheckoutAddOnId>([
  "dns",
  "starter",
  "new-build",
  "redesign",
  "social-media",
]);

const ADD_ONS_FOR_WEBSITE = new Set<CheckoutAddOnId>(["dns", "social-media"]);

export function bundleYearsFromPlanSlug(planSlug: CheckoutPlanSlug): number {
  if (planSlug === "starter-bot" || planSlug === "chatbot-1y") return 1;
  if (planSlug === "chatbot-2y") return 2;
  return 0; // website plans
}

export function planNameFromSlug(planSlug: CheckoutPlanSlug): string {
  const map: Record<CheckoutPlanSlug, string> = {
    "starter-bot": "Starter — 5 pages, 1 year",
    "chatbot-1y": "AI Chatbot (1 year)",
    "chatbot-2y": "AI Chatbot (2 years)",
    starter: "Quick WordPress Starter",
    "new-build": "Brand New Website Build",
    redesign: "Website Redesign / Refresh",
  };
  return map[planSlug];
}

export function isChatbotPlan(planSlug: CheckoutPlanSlug): boolean {
  return planSlug === "starter-bot" || planSlug === "chatbot-1y" || planSlug === "chatbot-2y";
}

export function computeCheckoutAmountCents(input: {
  planSlug: CheckoutPlanSlug;
  addOns: CheckoutAddOnId[];
  pages?: number; // required for chatbot plans (except starter-bot)
}): {
  amountCents: number;
  bundleYears: number;
  estimatedPages: number | null;
  allowedAddOns: CheckoutAddOnId[];
} {
  const { planSlug } = input;
  const bundleYears = bundleYearsFromPlanSlug(planSlug);

  const addOnsAllowedSet = planSlug === "starter" || planSlug === "new-build" || planSlug === "redesign"
    ? ADD_ONS_FOR_WEBSITE
    : ADD_ONS_FOR_CHATBOT;

  const safeAddOns = input.addOns.filter((a) => addOnsAllowedSet.has(a));

  let basePriceDollars: number;
  let estimatedPages: number | null = null;

  if (planSlug === "starter-bot") {
    basePriceDollars = FIXED_PLAN_PRICES["starter-bot"];
    estimatedPages = 5;
  } else if (planSlug === "chatbot-1y" || planSlug === "chatbot-2y") {
    const pages = typeof input.pages === "number" ? Math.round(input.pages) : NaN;
    if (!Number.isFinite(pages) || pages < 1 || pages >= 500) {
      throw new Error("Invalid pages. Must be 1–499 for chatbot checkout.");
    }
    const years: 1 | 2 = planSlug === "chatbot-2y" ? 2 : 1;
    const price = getPriceFromPagesAndYears(pages, years);
    if (price == null) {
      throw new Error("Pricing not available for this site size.");
    }
    basePriceDollars = price;
    estimatedPages = pages;
  } else {
    basePriceDollars = WEBSITE_PLAN_PRICES[planSlug];
    estimatedPages = null;
  }

  const addOnsDollars = safeAddOns.reduce((sum, a) => sum + (ADD_ON_PRICES[a] ?? 0), 0);
  const amountCents = Math.round((basePriceDollars + addOnsDollars) * 100);

  return {
    amountCents,
    bundleYears,
    estimatedPages,
    allowedAddOns: Array.from(addOnsAllowedSet),
  };
}

