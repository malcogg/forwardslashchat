# ForwardSlash.Chat - Current State & MVP Plan

## What We Have Today

### Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| UI | Tailwind, Radix, Lucide, next-themes |
| Auth | Clerk (email + Google) |
| Database | Neon Postgres + Drizzle ORM |
| Crawl | Firecrawl API (50 pages max) |
| Chat/LLM | Vercel AI SDK + OpenAI gpt-4o-mini |
| Payments | Stripe (structure), PayPal (planned) |

### Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Clerk sync, firecrawlPlan |
| `credit_usage` | Per-user Firecrawl credits (50 free, etc.) |
| `scans` | Scan results (url, pageCount, categories) |
| `orders` | Payment, bundle, status |
| `customers` | Per-order: businessName, domain, subdomain, websiteUrl |
| `content` | Crawled pages per customer for chat |

### Frontend Screens

| Route | Auth | What It Does |
|-------|------|--------------|
| `/` | Public | Landing, URL input, Scan modal, sidebar (scanned sites, demo link) |
| `/checkout` | Public | Form: business, domain, subdomain. "Create order (test)" or "Pay with Stripe" |
| `/sign-in`, `/sign-up` | Public | Clerk auth |
| `/dashboard` | Protected | Order status, chatbot details, DNS, checklist, iPhone mockup with chat |
| `/admin` | Protected (ADMIN_EMAILS) | List all orders, View, Crawl buttons |
| `/chat/demo` | Public | Hardcoded Demo Coffee chatbot (keyword-based, no LLM) |

### API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/scan` | POST | No | Firecrawl crawl, save scan, return pageCount. Cache check for existing content. |
| `/api/orders` | POST | No | Create order + customer |
| `/api/orders/me` | GET | Yes | User's orders (sidebar) |
| `/api/checkout/stripe` | POST | No | Create order + Stripe session |
| `/api/webhooks/stripe` | POST | No | Mark order paid |
| `/api/dashboard` | GET | Yes | Order + customer + contentCount, claim order |
| `/api/credits` | GET | Yes | User's credit balance |
| `/api/customers/[id]` | PATCH | Yes | Update status (testing, delivered) |
| `/api/customers/[id]/crawl` | POST | Yes | Crawl site, save content, deduct credits |
| `/api/chat` | POST | No | Stream LLM response using customer content |
| `/api/admin/orders` | GET | Admin | All orders with customers |
| `/api/admin/orders` | POST | Admin | Create test order + customer |

### Current Flow (What Works)

1. **Landing** → Enter URL → Scan (Firecrawl) → See page count + categories → Continue to payment
2. **Checkout** → Fill form → "Create order (test)" → Order + customer in DB → Redirect to dashboard
3. **Dashboard** → Sign in (Clerk) → Order linked to user → "Build my chatbot" → Crawl runs → Content saved → Chat in iPhone mockup
4. **Chat** → Uses content from DB, streams via OpenAI

### What’s Missing or Broken

1. **Super-admin bypass** – `ADMIN_EMAILS` users skip credit check/deduction on crawl ✓
2. **Public chat page** – `/chat/c/[customerId]` ✓
3. **Admin create order** – Form on `/admin` ✓
4. **Admin orders API** – GET/POST ✓
5. **Dashboard "Open full-page chat"** – Link when content exists ✓

Still TODO: host-based routing (`chat.theirdomain.com`), checkout stays public (intended)

---

## MVP Goal: End-to-End Test (Super Admin, No Payment)

You want to run this path without paying:

1. **Scan** a test site → save data  
2. **Create order** (no payment)  
3. **Train the bot** (crawl, save content)  
4. **Deploy to a test URL**  
5. **Talk to the bot** and confirm it works  

---

## Required Changes for MVP Test

### 1. Super-admin bypass credits

- If user email is in `ADMIN_EMAILS` → treat credits as effectively unlimited for crawl
- Admin can crawl without hitting the 50-credit limit

### 2. Public chat page for testing

- Add `/chat/c/[customerId]` (or `/chat?c=customerId`) – public
- Renders `CustomerChat` for that customer
- Lets you test: create order → crawl → open `/chat/c/xxx` and chat

### 3. Admin: create order without checkout

- Admin can create order + customer from `/admin` (URL, business name, domain)
- Skips payment

### 4. Database

- Ensure migration `001-credits.sql` is applied (credit_usage, last_crawled_at)
- No extra tables required for this MVP test

### 5. Flow check

- Scan → Checkout (test mode) → Dashboard → Build chatbot → Chat in mockup
- New: Admin creates order → Dashboard → Build → `/chat/c/[id]` for full-page test

---

## Detailed Flow (Frontend + Backend)

### A. Customer flow (with payment later)

```
[Landing]
  → User enters URL
  → Click Scan
  → POST /api/scan { url }
      → Cache check: content for same host? → return from DB (0 credits)
      → Else: Firecrawl crawl (shared credits)
      → Save to scans
      → Return pageCount, categories, scanId
  → ScanModal: results, pricing tier, DNS checkbox
  → Click "Continue to Payment"
  → Navigate to /checkout?scanId=&url=&amountCents=&...

[Checkout]
  → Form: businessName, domain, subdomain
  → "Create order (test)": POST /api/orders → order + customer
  → "Pay with Stripe": POST /api/checkout/stripe → redirect to Stripe
  → Success: redirect to /dashboard?orderId=xxx

[Dashboard] (protected)
  → Sign in (Clerk) if not
  → GET /api/dashboard?orderId= → order, customer, contentCount
  → Order claimed to user
  → "Build my chatbot": POST /api/customers/[id]/crawl
      → Credit check (admin bypass)
      → Firecrawl crawl
      → Save to content
      → Deduct credits (unless admin)
      → Set lastCrawledAt
  → iPhone mockup: CustomerChat(customerId) → POST /api/chat with customerId
```

### B. Super-admin test flow

```
[Admin]
  → /admin (ADMIN_EMAILS)
  → See all orders
  → Option: "Create test order" form (URL, business, domain)
      → POST /api/orders (or /api/admin/orders POST)
  → "Crawl" button per customer
  → "View" → /dashboard?orderId=xxx

[Crawl]
  → Admin triggers crawl
  → Credit check: if ADMIN_EMAILS → skip / grant unlimited
  → Crawl runs, content saved

[Test chat]
  → /chat/c/[customerId] (new)
  → Full-page CustomerChat
  → POST /api/chat { customerId, messages }
  → Same as dashboard mockup, but standalone URL
```

---

## Build Order for Today

1. **Admin credit bypass** – `ADMIN_EMAILS` users skip credit deduction
2. **Public chat page** – `/chat/c/[customerId]` for testing
3. **Admin create order** – Form to create order + customer without checkout
4. **Verify flow** – Run full path and fix any issues
