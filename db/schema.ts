import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { CrawlProgressSnapshot } from "@/lib/crawl-progress-types";

// Per-user credit allocation (your Firecrawl account is shared; each user gets a slice)
// 1 page = 1 credit. One crawl ≈ 50 credits. Adjust via FIRECRAWL_CREDITS_* env vars.
export const FIRECRAWL_PLANS = {
  free: { credits: 50, period: "one-time" as const },
  hobby: { credits: 100, period: "monthly" as const },
  standard: { credits: 250, period: "monthly" as const },
  growth: { credits: 500, period: "monthly" as const },
} as const;

// Users - for auth (Clerk/NextAuth will sync)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id").unique(), // Clerk/NextAuth user id
  email: text("email").notNull(),
  name: text("name"),
  firecrawlPlan: text("firecrawl_plan").default("free"), // free | hobby | standard | growth
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Pre-dashboard questionnaire (Path A: has website / Path B: no website). One row per user. */
export const userOnboarding = pgTable("user_onboarding", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  path: text("path").notNull(),
  referralSource: text("referral_source"),
  hasExistingAiChat: boolean("has_existing_ai_chat"),
  industry: text("industry"),
  dnsHelpPreference: text("dns_help_preference"),
  assistantPrimaryUse: text("assistant_primary_use"),
  websiteUrlSnapshot: text("website_url_snapshot"),
  noSiteProjectNote: text("no_site_project_note"),
  noSiteTimeline: text("no_site_timeline"),
  skippedStepIds: jsonb("skipped_step_ids").$type<string[]>().notNull().default([]),
  extra: jsonb("extra").$type<Record<string, unknown>>().notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Track reminder emails sent (payment_reminder_1, payment_reminder_2, payment_reminder_3)
export const reminderSent = pgTable("reminder_sent", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  reminderType: text("reminder_type").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-user Firecrawl credit usage
export const creditUsage = pgTable("credit_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  creditsUsed: integer("credits_used").notNull().default(0),
  periodStart: timestamp("period_start", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Scans - store scan results (can be anonymous before payment)
export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  pageCount: integer("page_count").notNull(),
  categories: jsonb("categories").$type<{ label: string; count: number }[]>().notNull().default([]),
  rawData: jsonb("raw_data"), // full crawl data for content extraction later
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Orders - payments (chatbot + website services)
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  scanId: uuid("scan_id").references(() => scans.id),
  amountCents: integer("amount_cents").notNull(),
  bundleYears: integer("bundle_years").notNull(), // 1-5 for chatbot; 0 for website
  planSlug: text("plan_slug"), // starter | new-build | redesign | chatbot-1y | chatbot-2y
  addOns: jsonb("add_ons").$type<string[]>().notNull().default([]),
  dnsHelp: boolean("dns_help").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending | paid | processing | delivered | failed
  paymentProvider: text("payment_provider"), // paypal | stripe
  paymentId: text("payment_id"), // external payment id
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  paidNotificationSentAt: timestamp("paid_notification_sent_at", { withTimezone: true }), // cron: "build your chatbot" email sent
  buildReminderSentAt: timestamp("build_reminder_sent_at", { withTimezone: true }), // optional: "build your bot" reminder (paid 2+ days, no content)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Stripe webhook deduplication / audit trail
export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Customers - chatbot config per order
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  businessName: text("business_name").notNull(),
  domain: text("domain").notNull(),
  subdomain: text("subdomain").notNull().default("chat"),
  websiteUrl: text("website_url").notNull(),
  estimatedPages: integer("estimated_pages"), // from roast; used for pricing before crawl
  primaryColor: text("primary_color").default("#000000"),
  logoUrl: text("logo_url"),
  welcomeMessage: text("welcome_message"),
  prepaidUntil: timestamp("prepaid_until", { withTimezone: true }),
  lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }), // for 7-day rescan cooldown
  status: text("status").notNull().default("pending"), // pending | content_collection | crawling | indexing | dns_setup | testing | delivered
  /** In-flight crawl UI + Firecrawl correlation; cleared when crawl completes successfully. */
  crawlProgress: jsonb("crawl_progress").$type<CrawlProgressSnapshot | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Checkout visits - signed-in users who viewed /checkout (for abandonment emails)
export const checkoutVisits = pgTable("checkout_visits", {
  userId: uuid("user_id").references(() => users.id).notNull().primaryKey(),
  visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
});

// Demo chat (/chat/demo) — name, email, optional phone before free-form chat
export const demoChatLeads = pgTable("demo_chat_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name"),
  email: text("email"),
  phone: text("phone"),
  skipped: boolean("skipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Paid customer chat — optional visitor contact capture (skippable), per customerId
export const customerChatLeads = pgTable("customer_chat_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .references(() => customers.id, { onDelete: "cascade" })
    .notNull(),
  firstName: text("first_name"),
  email: text("email"),
  phone: text("phone"),
  skipped: boolean("skipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Checkout leads - form data collected before payment
export const checkoutLeads = pgTable("checkout_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  businessName: text("business_name").notNull(),
  domain: text("domain").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  planSlug: text("plan_slug").notNull(),
  addOns: jsonb("add_ons").$type<string[]>().notNull().default([]),
  amountCents: integer("amount_cents").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Content - per-customer crawled pages for chat retrieval
export const content = pgTable("content", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  url: text("url").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-customer products (for rich chat product cards)
export const customerProducts = pgTable("customer_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  title: text("title").notNull(),
  price: text("price"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-customer blog posts (for rich chat blog cards)
export const customerBlogPosts = pgTable("customer_blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  url: text("url"),
  date: text("date"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Background jobs (minimal queue for serverless + cron workers)
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  status: text("status").notNull().default("queued"), // queued | running | succeeded | failed
  dedupeKey: text("dedupe_key").unique(), // prevents duplicate enqueues
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(8),
  runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lastError: text("last_error"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Rescan credits (purchased packs). Separate from the legacy per-plan credit_usage limits.
export const creditBalances = pgTable("credit_balances", {
  userId: uuid("user_id").references(() => users.id).notNull().primaryKey(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(), // purchase | rescan | admin
  stripeSessionId: text("stripe_session_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Simple rate limit buckets to protect OpenAI spend (per customer per minute).
export const chatRateLimits = pgTable("chat_rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(), // customer:<id> or ip:<ip>
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
