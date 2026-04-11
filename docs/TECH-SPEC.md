# ForwardSlash.Chat — Technical Specification

> **Last updated:** April 2026  
> One-time paid AI chatbots for SMBs. Scan site → pay once → deploy at chat.yourdomain.com.

---

## 1. Stack Overview

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL (Neon) via Drizzle ORM |
| **Auth** | Clerk |
| **Payments** | Stripe |
| **AI / LLM** | Vercel AI SDK + OpenAI (gpt-4o-mini) |
| **Web Scraping** | Firecrawl API |
| **Styling** | Tailwind CSS, next-themes, tailwindcss-animate |
| **UI Components** | Radix UI, shadcn-style (Button, Dialog, etc.) |

---

## 2. Project Structure

```
app/
├── page.tsx                    # Landing (Hero, How it works, Pricing, FAQ, CTA)
├── layout.tsx                   # Root layout: ClerkProvider, ThemeProvider, ParticlesBackground
├── globals.css
├── chat/
│   ├── demo/page.tsx            # Demo chatbot (product assistant)
│   └── c/[customerId]/page.tsx  # Customer-facing chat at /chat/c/{id}
├── dashboard/page.tsx           # Customer dashboard (design, domains, chat preview)
├── checkout/page.tsx            # Checkout flow (scan → tier → pay)
├── admin/page.tsx              # Admin orders (protected by ADMIN_EMAILS)
├── sign-in/[[...sign-in]]/      # Clerk sign-in
├── sign-up/[[...sign-up]]/      # Clerk sign-up
└── api/
    ├── scan/route.ts            # POST: Firecrawl scan (anonymous)
    ├── checkout/stripe/route.ts # POST: Create order + Stripe session
    ├── webhooks/stripe/route.ts # POST: Stripe webhook (checkout.session.completed)
    ├── dashboard/route.ts      # GET: Dashboard data for order
    ├── orders/me/route.ts      # GET: User's orders
    ├── orders/route.ts         # POST: Create order (no Stripe)
    ├── orders/[id]/route.ts    # GET: Single order
    ├── customers/[id]/route.ts # PATCH: Update customer
    ├── customers/[id]/crawl/   # POST: Crawl customer site (auth, credits)
    ├── customers/by-order/[orderId]/route.ts
    ├── chat/route.ts           # POST: Customer chat (streaming)
    ├── chat/demo/route.ts      # POST: Demo chat (streaming)
    ├── chat/demo/lead/route.ts # POST: Demo lead capture → demo_chat_leads
    ├── chat/customer-lead/route.ts # POST: Paid-widget visitor leads → customer_chat_leads
    ├── chat/customer/[customerId]/route.ts  # GET: Customer metadata (public)
    ├── credits/route.ts       # GET: User credit balance
    └── admin/orders/route.ts  # GET: All orders (admin only)

components/
├── landing/                     # Header, HeroSection, HowItWorks, etc.
├── ThemeToggle.tsx
├── FadeInSection.tsx           # Scroll-triggered fade-in animation
├── ParticlesBackground.tsx     # Floating dots background
├── ScanModal.tsx
├── CustomerChat.tsx             # Chat UI (useChat + /api/chat)
├── ui/                          # Button, etc.
└── theme-provider.tsx

db/
├── index.ts                     # Drizzle + Neon serverless
├── schema.ts                    # Tables: users, creditUsage, scans, orders, customers, content
└── drizzle.config.ts
```

---

## 3. Database Schema

| Table | Purpose |
|-------|---------|
| **users** | `id`, `externalId` (Clerk), `email`, `name`, `firecrawlPlan` |
| **credit_usage** | Per-user Firecrawl credits: `userId`, `creditsUsed`, `periodStart` |
| **scans** | Pre-checkout scan: `url`, `pageCount`, `categories`, `rawData` |
| **orders** | Payment: `userId`, `scanId`, `amountCents`, `bundleYears`, `dnsHelp`, `status`, `paymentProvider`, `paymentId` |
| **customers** | Per-order: `orderId`, `businessName`, `domain`, `subdomain`, `websiteUrl`, `primaryColor`, `status`, `prepaidUntil` |
| **content** | Crawled pages for chat: `customerId`, `url`, `title`, `content`, `description` |
| **demo_chat_leads** | Public demo (`/chat/demo`): `first_name`, `email`, `phone`, `skipped`, `created_at` — see migration `016-demo-chat-leads.sql` |
| **customer_chat_leads** | Paid customer chat widget: same shape + `customer_id` FK — migration `017-customer-chat-leads.sql` |

**Customer status flow:** `pending` → `content_collection` → `crawling` → `indexing` → `dns_setup` → `testing` → `delivered`

**Order status:** `pending` | `paid` | `processing` | `delivered` | `failed`

---

## 4. API Reference

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Run Firecrawl crawl on URL. Returns `pageCount`, `categories`, `scanId` |
| GET | `/api/chat/customer/[customerId]` | Customer metadata (businessName, primaryColor) for chat page |

### Auth required (Clerk)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard?orderId=` | Dashboard data (order, customer, contentCount) |
| GET | `/api/orders/me` | User's orders with customer info |
| GET | `/api/credits` | `{ remaining, creditsLimit }` |
| POST | `/api/customers/[id]/crawl` | Crawl customer site; deduct credits; insert content |

### Checkout (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/checkout/stripe` | Create order + customer, return Stripe Checkout URL |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe` | On `checkout.session.completed`: set `orders.status = paid` |

### Chat (customer / demo)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Body: `{ customerId, messages }`. Streams LLM response; **expands** known **`/slash`** commands on the last user turn (see `lib/chat-slash-commands.ts`) |
| POST | `/api/chat/customer-lead` | Body: `{ customerId, skipped?: true }` **or** `{ customerId, firstName, email, phone? }`. Paid customer only → `customer_chat_leads`; IP rate limit |
| POST | `/api/chat/demo` | Body: `{ messages }`. Streams product assistant from `data/demo-content.json`; rate-limited by IP |
| POST | `/api/chat/demo/lead` | Body: `{ skipped: true }` **or** `{ firstName, email, phone? }`. Persists to `demo_chat_leads` |

---

## 5. Auth & Middleware

- **Clerk** for sign-in / sign-up / session
- **Middleware** protects `/dashboard` and `/fs-ops/*`; allows `/`, `/chat/demo`, sign-in, sign-up
- **getOrCreateUser()** in `lib/auth.ts`: syncs Clerk user → `users` table, returns `{ userId, clerkUserId, email }`

---

## 6. Credits (Firecrawl)

- **Plans:** `free` (50 one-time), `hobby` (100/mo), `standard` (250/mo), `growth` (500/mo)
- Overridable via env: `FIRECRAWL_CREDITS_FREE`, `FIRECRAWL_CREDITS_HOBBY`, etc.
- **Admins** (ADMIN_EMAILS) bypass credit limits
- Crawl uses ~50 credits per run (limit: 50 pages)

---

## 7. Chat / LLM

- **Vercel AI SDK** `streamText` + `@ai-sdk/openai`
- **Model:** `gpt-4o-mini`
- **Context:** Customer `content` rows concatenated; system prompt instructs “answer only from this content”
- **Slash commands (customer chat):** Last user message, if it matches `/about`, `/pricing`, etc., is **rewritten server-side** to a structured instruction before `streamText`. See `docs/CUSTOMER-CHAT-VISITOR-FEATURES.md`.
- **Demo (LLM path):** Uses `data/demo-content.json` for product Q&A. The `/chat/demo` **page** also uses **client-side keyword shortcuts** for common questions (instant replies + pills); non-matching queries hit the LLM.
- **Demo leads:** `POST /api/chat/demo/lead` requires `DATABASE_URL`; IP rate limit via `DEMO_LEAD_RATE_LIMIT_PER_MINUTE` (default 15).
- **Customer-chat leads:** `POST /api/chat/customer-lead`; IP rate limit `CUSTOMER_CHAT_LEAD_RATE_LIMIT_PER_MINUTE` (default 20). Dashboard exposes `visitorLeads` on `GET /api/dashboard`.

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` / `POSTGRES_URL` | Yes | Neon Postgres connection string (pooled) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret |
| `OPENAI_API_KEY` | Yes (for chat) | OpenAI API key |
| `FIRECRAWL_API_KEY` | Yes (for scan/crawl) | Firecrawl API key |
| `STRIPE_SECRET_KEY` | Yes (checkout) | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes (webhooks) | Stripe webhook signing secret |
| `ADMIN_EMAILS` | Optional | Comma-separated emails for `/api/admin/*` |
| `ADMIN_PATH_TOKEN` | Optional | Secret segment for admin UI at `/fs-ops/{token}` |
| `NEXT_PUBLIC_STRATEGY_CALL_URL` | Optional | Cal.com link for upsell CTA (default: cal.com/forwardslash/30min) |
| `NEXT_PUBLIC_APP_URL` / `VERCEL_URL` | Optional | Base URL for Stripe redirects |

---

## 9. Frontend Architecture

### Landing page

- **Sections:** Hero (scan input), How it works (Scan, Brand, Domain, Payments, Chat demo), Pricing, FAQ, CTA
- **Design:** Scroll-triggered fade-in (`FadeInSection`), light/dark theme
- **Theme:** `next-themes`; `ThemeToggle` in Header, Demo, Dashboard
- **Particles:** `ParticlesBackground` for floating dots

### Dashboard

- **Layout:** Browser bar, sidebar (scan dropdown, Training, Design, Domains, DNS, Users, Settings), center panel, chat preview
- **Chat preview:** `CustomerChat` component with `useChat` and streaming

### Demo chat

- `/chat/demo` — **Lead capture** (name / email / phone, skippable) → then **hybrid** chat: keyword replies + `POST /api/chat/demo` for open questions. **New chat (+)** clears the thread only; **`?forceLead=1`** replays the intro. Session flag: `sessionStorage` key `fs_demo_lead_v2`.

### Customer chat

- `/chat/c/[customerId]` — public chat for deployed chatbots; **optional lead gate** + **`/command` shortcuts** (`CustomerChat`, `CustomerChatLeadGate`). Details: [CUSTOMER-CHAT-VISITOR-FEATURES.md](./CUSTOMER-CHAT-VISITOR-FEATURES.md).

---

## 10. Key Dependencies

```json
{
  "next": "^15.1.0",
  "react": "^19.0.0",
  "@clerk/nextjs": "^6.0.0",
  "@neondatabase/serverless": "^0.10.0",
  "drizzle-orm": "^0.36.0",
  "stripe": "^17.0.0",
  "ai": "^4.0.0",
  "@ai-sdk/openai": "^1.0.0",
  "next-themes": "^0.3.0",
  "tailwindcss-animate": "^1.0.7",
  "lucide-react": "^0.460.0",
  "zod": "^3.24.0"
}
```

---

## 11. Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Drizzle: generate migrations |
| `npm run db:migrate` | Drizzle: run migrations |
| `npm run db:push` | Drizzle: push schema to DB |
| `npm run db:studio` | Drizzle Studio UI |

---

## 12. DNS / Deployment

- **Subdomain:** chat.{domain} or {domain}/chat
- **CNAME:** `{subdomain}` → `cname.forwardslash.chat`
- **Upsell:** “Let us help with DNS” → Cal.com booking
