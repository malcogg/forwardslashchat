import type { ChatCardBlock, ProductCardBlock, BlogCardBlock } from "@/components/chat/chat-types";

const DEMO_IMAGE_BASE = "/demo";

/** ForwardSlash demo product cards (our products) — use with keyword matching */
export const DEMO_PRODUCT_CARDS: ProductCardBlock[] = [
  {
    type: "product",
    id: "demo-starter",
    title: "Quick Starter — $350",
    price: "$350 one-time",
    description: "10 clean pages, mobile-ready, basic SEO, contact form + map, year 1 hosting included.",
    productUrl: "/checkout?plan=starter",
    imageUrl: `${DEMO_IMAGE_BASE}/quick_starter.png`,
  },
  {
    type: "product",
    id: "demo-new-build",
    title: "New Build — $1,000",
    price: "$1,000 one-time",
    description: "Full custom modern website (Next.js or WordPress) + built-in AI chatbot. Year 1 hosting included.",
    productUrl: "/checkout?plan=new-build",
    imageUrl: `${DEMO_IMAGE_BASE}/new_build.png`,
  },
  {
    type: "product",
    id: "demo-chatbot",
    title: "AI Chatbot",
    price: "From $799 (1yr) or $1,099 (2yr)",
    description: "Custom AI chatbot trained on your site. Answers customers 24/7 — no monthly fees.",
    productUrl: "/?pages=25#pricing",
    imageUrl: `${DEMO_IMAGE_BASE}/ai_chatbot.png`,
  },
];

/** Placeholder blog cards for demo — show only when user asks about blog/articles */
export const DEMO_BLOG_CARDS: BlogCardBlock[] = [
  {
    type: "blog",
    id: "demo-blog-1",
    title: "How to Get Your Business Online in 2026",
    excerpt: "Simple steps to launch a professional website and AI chatbot without monthly fees.",
    date: "Jan 15, 2026",
    url: "/blog/get-online-2026",
    imageUrl: `${DEMO_IMAGE_BASE}/blog_1.png`,
  },
  {
    type: "blog",
    id: "demo-blog-2",
    title: "Why Florida Businesses Choose One-Time Pricing",
    excerpt: "No subscriptions, no surprises — pay once and own your site.",
    date: "Jan 8, 2026",
    url: "/blog/one-time-pricing",
    imageUrl: `${DEMO_IMAGE_BASE}/blog_2.png`,
  },
  {
    type: "blog",
    id: "demo-blog-3",
    title: "AI Chatbot for Local Businesses: What to Expect",
    excerpt: "See how a custom chatbot can answer FAQs, hours, and services 24/7 on your site.",
    date: "Dec 20, 2025",
    url: "/blog/ai-chatbot-local",
    imageUrl: `${DEMO_IMAGE_BASE}/blog_3.png`,
  },
];

const MAX_CARDS_PER_ROW = 3;

/** Keywords that map to product card indices (0=starter, 1=new build, 2=chatbot). Redesign has no card, we only have 3 products. */
const PRODUCT_KEYWORDS: [number, string[]][] = [
  [0, ["quick", "starter", "350", "$350", "simple site", "just get started", "cheapest", "basic site"]],
  [1, ["new build", "new website", "brand new", "1000", "$1000", "$1,000", "full site", "custom build", "custom website", "what's included", "redesign", "refresh", "upgrade", "2000", "$2000"]],
  [2, ["ai chatbot", "chatbot", "ai chat", "ai ", "what is the ai", "how does the ai work", "chat bot"]],
];

/** Query is about blog/articles → show blog cards */
const BLOG_KEYWORDS = ["blog", "blogs", "article", "articles", "post", "posts", "read", "writing", "tips"];

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

/** Returns true if we should show the compact "Blog" pill (so user can tap to see blog cards). Show when we did NOT show blog cards. */
export function shouldShowBlogPill(userQuery: string): boolean {
  const q = normalizeQuery(userQuery);
  if (!q) return false;
  if (BLOG_KEYWORDS.some((kw) => q.includes(kw))) return false;
  return true;
}

/** Returns true if the user is asking about blog/content to read */
export function isBlogQuery(userQuery: string): boolean {
  const q = normalizeQuery(userQuery);
  return BLOG_KEYWORDS.some((kw) => q.includes(kw));
}

/**
 * Returns up to 3 cards (one row) based on the user's query.
 * - Blog-related query → up to 3 blog cards.
 * - Product/pricing/plan query → up to 3 relevant product cards by keyword.
 * - No match → no cards (assistant text + optional Blog pill).
 */
export function getDemoCardsForMessage(userQuery: string): ChatCardBlock[] {
  const q = normalizeQuery(userQuery);
  if (!q) return [];

  if (isBlogQuery(q)) {
    return DEMO_BLOG_CARDS.slice(0, MAX_CARDS_PER_ROW);
  }

  const matchedProductIndices = new Set<number>();
  for (const [index, keywords] of PRODUCT_KEYWORDS) {
    if (keywords.some((kw) => q.includes(kw))) matchedProductIndices.add(index);
  }

  if (matchedProductIndices.size === 0) {
    const pricingTerms = ["price", "pricing", "cost", "how much", "plans", "plan", "pay", "fee"];
    if (pricingTerms.some((t) => q.includes(t))) {
      return DEMO_PRODUCT_CARDS.slice(0, MAX_CARDS_PER_ROW);
    }
    return [];
  }

  const cards: ChatCardBlock[] = [];
  for (const i of Array.from(matchedProductIndices).slice(0, MAX_CARDS_PER_ROW)) {
    if (DEMO_PRODUCT_CARDS[i]) cards.push(DEMO_PRODUCT_CARDS[i]);
  }
  return cards;
}
