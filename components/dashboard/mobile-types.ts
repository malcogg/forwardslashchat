/** Shared types for Rork-style mobile dashboard views */

export type MobileScreen = "home" | "add" | "account" | "site-detail";

export type OrderRow = {
  order: {
    id: string;
    status?: string;
    planSlug?: string;
    amountCents?: number;
    bundleYears?: number;
  };
  customer: {
    id?: string;
    businessName: string;
    websiteUrl: string;
    domain?: string;
    subdomain?: string;
    status?: string;
  } | null;
  contentCount: number;
  estimatedPages: number;
};

export function getSiteStatusLabel(order: OrderRow["order"], customer: OrderRow["customer"] | undefined, contentCount: number): string {
  if (!customer) return "Checkout pending";
  const isWebsite = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  if (isWebsite) {
    if (order.status === "delivered") return "Delivered";
    if (order.status === "processing") return "In progress";
    if (order.status === "paid") return "In progress";
    return "Checkout pending";
  }
  if (customer.status === "delivered") return "Live";
  if (["crawling", "indexing"].includes(customer.status ?? "")) return "Indexing";
  if (["testing", "dns_setup"].includes(customer.status ?? "")) return "Domain";
  if (contentCount > 0 || (customer.status && !["content_collection"].includes(customer.status ?? ""))) {
    return "Domain";
  }
  if (["paid", "processing", "delivered"].includes(order.status ?? "")) return "Ready to scan";
  return "Checkout pending";
}

export function getSiteStatusDot(order: OrderRow["order"], customer: OrderRow["customer"] | undefined, contentCount: number): "live" | "domain" | "training" {
  const label = getSiteStatusLabel(order, customer, contentCount);
  if (label === "Live" || label === "Delivered") return "live";
  if (label === "Domain" || label === "In progress" || label === "Building") return "domain";
  return "training";
}

export function getPlanLabel(order: OrderRow["order"], estimatedPages: number): string {
  if (order.planSlug === "starter-bot") return "Starter";
  if (order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug)) {
    const names: Record<string, string> = {
      starter: "Quick WordPress",
      "new-build": "New Build",
      redesign: "Redesign",
    };
    return names[order.planSlug] ?? order.planSlug;
  }
  if (estimatedPages <= 5) return "Starter";
  if (estimatedPages <= 50) return "Growth";
  if (estimatedPages <= 200) return "Essential";
  return "Pro";
}

/** Stripe-aligned checkout CTAs: amount when known, otherwise neutral “checkout”. */
export function getMobilePaymentCtaLabels(input: {
  isWebsiteOrder: boolean;
  unpaidQuoteDollars: number | null;
  amountCents?: number | null;
}): { compact: string; primary: string } {
  const quote = input.unpaidQuoteDollars;
  const cents = input.amountCents ?? 0;
  const money =
    quote != null
      ? `$${quote.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
      : cents > 0
        ? (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })
        : null;

  if (input.isWebsiteOrder) {
    if (money) {
      return {
        compact: `Pay ${money}`,
        primary: `Confirm & pay ${money}`,
      };
    }
    return {
      compact: "Continue to checkout",
      primary: "Continue to checkout",
    };
  }

  if (money) {
    return {
      compact: `${money} · Checkout`,
      primary: `Continue to checkout · ${money}`,
    };
  }
  return {
    compact: "Continue to checkout",
    primary: "Continue to checkout",
  };
}

export function getProgressSteps(order: OrderRow["order"], customer: OrderRow["customer"] | undefined, contentCount: number) {
  const isWebsite = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  const checkoutDone = ["paid", "processing", "delivered"].includes(order.status ?? "");

  if (isWebsite) {
    const delivered = order.status === "delivered";
    return [
      { key: "payment", label: checkoutDone ? "Paid" : "Checkout", done: checkoutDone },
      { key: "delivered", label: delivered ? "Delivered" : "Handoff", done: delivered },
    ];
  }

  const contentDone =
    contentCount > 0 || ["dns_setup", "testing", "delivered"].includes(customer?.status ?? "");
  const dnsDone = ["testing", "delivered"].includes(customer?.status ?? "");
  const liveDone = customer?.status === "delivered";

  return [
    { key: "payment", label: checkoutDone ? "Paid" : "Checkout", done: checkoutDone },
    {
      key: "content",
      label: contentDone ? "Indexed" : "Index site",
      done: contentDone,
    },
    { key: "dns", label: dnsDone ? "DNS ready" : "Connect domain", done: dnsDone },
    { key: "live", label: liveDone ? "Live" : "Go live", done: liveDone },
  ];
}
