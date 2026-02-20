import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

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

// Orders - payments
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  scanId: uuid("scan_id").references(() => scans.id),
  amountCents: integer("amount_cents").notNull(),
  bundleYears: integer("bundle_years").notNull(), // 1-5
  dnsHelp: boolean("dns_help").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending | paid | processing | delivered | failed
  paymentProvider: text("payment_provider"), // paypal | stripe
  paymentId: text("payment_id"), // external payment id
  paidNotificationSentAt: timestamp("paid_notification_sent_at", { withTimezone: true }), // cron: "build your chatbot" email sent
  buildReminderSentAt: timestamp("build_reminder_sent_at", { withTimezone: true }), // optional: "build your bot" reminder (paid 2+ days, no content)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Checkout visits - signed-in users who viewed /checkout (for abandonment emails)
export const checkoutVisits = pgTable("checkout_visits", {
  userId: uuid("user_id").references(() => users.id).notNull().primaryKey(),
  visitedAt: timestamp("visited_at", { withTimezone: true }).defaultNow().notNull(),
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
