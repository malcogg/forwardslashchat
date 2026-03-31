# ForwardSlash.Chat — Technical Specification

> **Last updated:** February 2026  
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
| POST | `/api/chat` | Body: `{ customerId, messages }`. Streams LLM response using customer content |
| POST | `/api/chat/demo` | Streams ForwardSlash product assistant |

---

## 5. Auth & Middleware

- **Clerk** for sign-in / sign-up / session
- **Middleware** protects `/dashboard` and `/admin`; allows `/`, `/chat/demo`, sign-in, sign-up
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
- **Demo:** Uses `data/demo-content.json` for product Q&A

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
| `ADMIN_EMAILS` | Optional | Comma-separated emails for `/admin` |
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

- `/chat/demo` — product assistant using `/api/chat/demo`, `data/demo-content.json`

### Customer chat

- `/chat/c/[customerId]` — public chat for deployed chatbots

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
