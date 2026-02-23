import type { ChatCardBlock, ProductCardBlock, BlogCardBlock } from "@/components/chat/chat-types";

/** ForwardSlash demo product cards (our products) */
export const DEMO_PRODUCT_CARDS: ProductCardBlock[] = [
  {
    type: "product",
    id: "demo-starter",
    title: "Quick Starter — $350",
    price: "$350 one-time",
    description: "10 clean pages, mobile-ready, basic SEO, contact form + map, year 1 hosting included.",
    productUrl: "/checkout?plan=starter",
    imageUrl: "https://placehold.co/280x210/e2e8f0/64748b?text=Quick+Starter",
  },
  {
    type: "product",
    id: "demo-new-build",
    title: "New Build — $1,000",
    price: "$1,000 one-time",
    description: "Full custom modern website (Next.js or WordPress) + built-in AI chatbot. Year 1 hosting included.",
    productUrl: "/checkout?plan=new-build",
    imageUrl: "https://placehold.co/280x210/e2e8f0/64748b?text=New+Build",
  },
  {
    type: "product",
    id: "demo-chatbot",
    title: "AI Chatbot",
    price: "From $799 (1yr) or $1,099 (2yr)",
    description: "Custom AI chatbot trained on your site. Answers customers 24/7 — no monthly fees.",
    productUrl: "/?pages=25#pricing",
    imageUrl: "https://placehold.co/280x210/e2e8f0/64748b?text=AI+Chatbot",
  },
];

/** Placeholder blog cards for demo (match end-product look) */
export const DEMO_BLOG_CARDS: BlogCardBlock[] = [
  {
    type: "blog",
    id: "demo-blog-1",
    title: "How to Get Your Business Online in 2026",
    excerpt: "Simple steps to launch a professional website and AI chatbot without monthly fees.",
    date: "Jan 15, 2026",
    url: "/blog/get-online-2026",
    imageUrl: "https://placehold.co/280x158/e2e8f0/64748b?text=Blog+1",
  },
  {
    type: "blog",
    id: "demo-blog-2",
    title: "Why Florida Businesses Choose One-Time Pricing",
    excerpt: "No subscriptions, no surprises — pay once and own your site. Here's how it works.",
    date: "Jan 8, 2026",
    url: "/blog/one-time-pricing",
    imageUrl: "https://placehold.co/280x158/e2e8f0/64748b?text=Blog+2",
  },
  {
    type: "blog",
    id: "demo-blog-3",
    title: "AI Chatbot for Local Businesses: What to Expect",
    excerpt: "See how a custom chatbot can answer FAQs, hours, and services 24/7 on your site.",
    date: "Dec 20, 2025",
    url: "/blog/ai-chatbot-local",
    imageUrl: "https://placehold.co/280x158/e2e8f0/64748b?text=Blog+3",
  },
];

/** All demo cards to show under assistant messages (products first, then blogs) */
export function getDemoCardsForMessage(_messageContent: string): ChatCardBlock[] {
  return [...DEMO_PRODUCT_CARDS, ...DEMO_BLOG_CARDS];
}
