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

export function getSiteStatusLabel(order: OrderRow["order"], customer: OrderRow["customer"], contentCount: number): string {
  if (!customer) return "Payment";
  const isWebsite = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  if (isWebsite) {
    if (order.status === "delivered") return "Delivered";
    if (order.status === "processing") return "Building";
    return "Payment";
  }
  if (customer.status === "delivered") return "Live";
  if (["testing", "dns_setup"].includes(customer.status ?? "")) return "Domain Setup";
  if (contentCount > 0 || (customer.status && !["content_collection"].includes(customer.status))) return "Domain Setup";
  if (order.status === "paid") return "Training AI";
  return "Payment";
}

export function getSiteStatusDot(order: OrderRow["order"], customer: OrderRow["customer"], contentCount: number): "live" | "domain" | "training" {
  const label = getSiteStatusLabel(order, customer, contentCount);
  if (label === "Live") return "live";
  if (label === "Domain Setup") return "domain";
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

export function getProgressSteps(order: OrderRow["order"], customer: OrderRow["customer"], contentCount: number) {
  const isWebsite = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  if (isWebsite) {
    return [
      { key: "payment", label: "Payment", done: ["paid", "processing", "delivered"].includes(order.status ?? "") },
      { key: "planning", label: "Planning", done: ["processing", "delivered"].includes(order.status ?? "") },
      { key: "design", label: "Design", done: ["processing", "delivered"].includes(order.status ?? "") },
      { key: "delivered", label: "Delivered", done: order.status === "delivered" },
    ];
  }
  return [
    { key: "payment", label: "Payment", done: ["paid", "processing", "delivered"].includes(order.status ?? "") },
    { key: "content", label: "AI Training", done: contentCount > 0 || ["dns_setup", "testing", "delivered"].includes(customer?.status ?? "") },
    { key: "dns", label: "Domain Setup", done: ["testing", "delivered"].includes(customer?.status ?? "") },
    { key: "live", label: "Live", done: customer?.status === "delivered" },
  ];
}
