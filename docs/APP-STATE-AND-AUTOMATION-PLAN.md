# ForwardSlash.Chat – Full Breakdown & Automation Plan

## How the App Works

### Architecture

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Next.js 15, React 19, Tailwind | Landing, dashboard, checkout, chat |
| Auth | Clerk | Sign up, sign in (Google, email) |
| DB | Neon Postgres, Drizzle ORM | users, orders, customers, content, scans, credit_usage |
| Scraping | Firecrawl API | Crawl customer websites → markdown |
| Chat / AI | OpenAI (gpt-4o-mini), AI SDK | RAG-style chat using crawled content |
| Email | Resend | Welcome, payment reminder, order confirmation |
| Hosting | Vercel | Landing app + customer chatbots |

### Data Flow

```
Landing (URL) → Sign up (Clerk) → Dashboard → Pay (PayPal) → Crawl (Firecrawl)
     → Content saved to DB → Chat uses content for RAG
```

---

## What’s Automated vs Manual

### Automated

| Step | What Happens |
|------|---------------|
| Signup | Clerk handles auth; webhook sends welcome email |
| Project creation | Pending URL → `POST /api/scan-request` creates order + customer |
| Payment reminder | Vercel cron runs daily; sends to users who signed up 2+ days ago with no paid order |
| Crawl | User pays → clicks "Build my chatbot" → `POST /api/customers/[id]/crawl` runs Firecrawl, saves to `content` |
| Chat | `/chat/c/[customerId]` and `/api/chat` use content for RAG; streaming works today |

### Manual

| Step | Who Does It | Why |
|------|-------------|-----|
| Mark order paid | You (admin) | PayPal has no webhook yet; you update `orders.status = 'paid'` |
| DNS setup | Customer (or you for +$99) | Customer adds CNAME; you verify and add domain in Vercel |
| Deploy chatbot | You | No automated deploy; you add domain in Vercel for `chat.customer.com` |
| Go-live | You | You manually wire content → live URL and tell the customer |

---

## What Needs to Be Done (Current Gaps)

1. **Order status from PayPal** – Webhook or manual flow to set `orders.status = 'paid'`
2. **DNS verification** – Automated check that CNAME points to `cname.forwardslash.chat`
3. **Domain → customer mapping** – Table/config so `chat.business.com` resolves to the right customer
4. **“Go live” flow** – User trigger that connects their domain to their chatbot in our app
5. **Credit migration** – Ensure `credit_usage` table exists in Neon (SQL already documented)

---

## DNS Verification (How Other Apps Do It)

### Pattern (Vercel, Netlify, Cloudflare)

1. User enters `chat.business.com` (or chooses subdomain)
2. App shows: “Add this CNAME: `chat` → `cname.forwardslash.chat`”
3. User adds CNAME in their DNS (Cloudflare, Namecheap, etc.)
4. User clicks **Verify DNS**
5. Backend does a DNS lookup (e.g. `dig` or DNS-over-HTTPS API)
6. If CNAME matches → mark “Verified”, enable go-live

### What We Need

| Component | Description |
|-----------|-------------|
| DNS lookup API | Server-side check that `chat.business.com` CNAME points to our target |
| `POST /api/dns/verify` | Input: `domain`, `subdomain`; output: `verified: boolean` |
| Dashboard UI | “Verify DNS” button; shows success/error |
| DB | `customers.dns_verified_at` (or similar) to remember verification |

### Implementation Options

**A) Node `dns.promises.resolve()`**
- Built-in; works in Node runtime
- May be blocked or limited in serverless/Vercel

**B) DNS-over-HTTPS (DoH)**
- Google: `https://dns.google/resolve?name=chat.business.com&type=CNAME`
- Cloudflare: `https://cloudflare-dns.com/dns-query?name=chat.business.com&type=CNAME`
- Works well in serverless

**C) External API**
- e.g. DNSimple, NS1, etc. (usually paid)

**Suggested:** Use DoH (Google or Cloudflare); no extra keys for basic CNAME checks.

---

## Forking the Vercel AI Chatbot vs Multi-Tenant

### Option A: Multi-Tenant (Recommended)

We already have:
- `/chat/c/[customerId]` serving chat
- `/api/chat` using `content` for RAG

To support custom domains:
1. Add `chat.business.com` to our Vercel project
2. Middleware: map `hostname` → `customerId` (via `domain` → `customer` lookup)
3. Chat stays on our app; only routing changes

**Pros:** No forks, one codebase, simpler  
**Cons:** All chatbots share one Next.js app

### Option B: Per-Customer Fork (Vercel AI Chatbot Template)

Fork [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) for each customer.

**Steps:**
1. GitHub API: create repo from `vercel/ai-chatbot` template
2. Replace/environmentalize content with this customer’s crawled data
3. Vercel API: create project, link repo, set env vars
4. Vercel API: add domain `chat.business.com`
5. Deploy

**Pros:** Isolated per customer  
**Cons:** More moving parts; template uses its own Neon/Blob/Auth; needs non-trivial customization for RAG from our `content` table

---

## Full Automation Roadmap

### Phase 1: DNS Verification (No Fork)

1. Add `POST /api/dns/verify` (DoH CNAME check)
2. Add `dns_verified_at` to `customers`
3. Dashboard: “Verify DNS” button and status
4. Domain config table: `customer_domains` with `domain`, `customer_id`, `verified_at`

### Phase 2: Custom Domain Routing (Multi-Tenant)

1. Add `chat.business.com`-style domains in Vercel
2. Middleware: resolve hostname → `customerId` from DB
3. “Go live” button that:
   - Requires `dns_verified_at`
   - Adds domain in Vercel (Vercel API)
   - Links domain → customer in our DB

### Phase 3: PayPal Webhook (Optional)

1. PayPal IPN or webhooks
2. On payment confirmation → set `orders.status = 'paid'`
3. Optionally trigger order-confirmation email

### Phase 4: Per-Customer Fork (Only If Needed)

1. GitHub API: create repo from template
2. Script: inject customer config and content
3. Vercel API: create project, env vars, domain
4. Background job or queue for deploy

---

## If We Do Multi-Tenant + DNS + “Go Live”

We do **not** need to fork the Vercel AI Chatbot. What we need:

| Task | Details |
|------|---------|
| DNS verification | DoH API or `dns.promises` to verify CNAME |
| Domain → customer | Table + lookup in middleware |
| Vercel domain | Vercel API to add `chat.business.com` to our project |
| “Go live” button | Checks DNS + content; calls Vercel API; updates customer status |
| Middleware | `chat.business.com` → load customer by domain → render `/chat/c/[customerId]` |

Chat already works; the work is DNS, domain mapping, and Vercel domain setup.

---

## Suggested Improvements (Existing System)

| Area | Suggestion |
|------|-------------|
| Order status | Add PayPal webhook or simple admin “Mark paid” action |
| Long crawls | Firecrawl webhook or async job for 5–30 min sites |
| Checkout data | Save business name, domain, URL to DB before payment |
| Payment reminder | Track `payment_reminder_sent_at` to avoid repeat sends |
| Dashboard | Status timeline, “Verify DNS” step, “Go live” step |
| Errors | Toast / inline errors for crawl, verify, go-live |
| Credits | Run migration if `credit_usage` is missing |

---

## What We Need for DNS Verification (Concrete)

```
1. API route: POST /api/dns/verify
   - Body: { domain, subdomain }  (e.g. business.com, chat)
   - Resolves: chat.business.com via DNS-over-HTTPS
   - Checks: CNAME points to cname.forwardslash.chat
   - Returns: { verified: true } or { verified: false, reason }

2. DB: customers.dns_verified_at (timestamp, nullable)

3. Dashboard: "Verify DNS" button in Domains panel
```

---

## What We Need for "Go Live" (Concrete)

```
1. Vercel API
   - VERCEL_ACCESS_TOKEN in env
   - Add domain to project via Vercel REST API

2. Domain → customer mapping (middleware)
   - Request host chat.business.com → lookup customer → render /chat/c/[id]

3. "Go live" button
   - Requires: content crawled + DNS verified
   - On click: Vercel API add domain, set status = delivered
```

---

## Summary

- **Current:** Signup, welcome, payment reminder, crawl, and chat are automated. Payment marking, DNS, and going live are manual.
- **DNS automation:** Add DoH-based CNAME verification and a “Verify DNS” flow.
- **Go-live automation:** Add domain mapping and Vercel API calls; no fork required if we stay multi-tenant.
- **Fork approach:** Only needed if you want fully separate apps per customer; more complex than extending our existing app.

---

## Current specifics (for targeted implementation advice)

### Middleware

**File:** `middleware.ts` (root). Today it only does Clerk auth — no domain → customer resolution yet.

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/chat/demo", "/checkout", "/services", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)", "/api/cron(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  if (isProtectedRoute(req) && !isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- **Not yet:** Host-based routing; skip for `/api/`, `/_next/`, `/dashboard`, `/checkout`, etc.; lookup `host` → `customerId`; rewrite to `/chat/c/[customerId]`.
- Chat is already at `/chat/c/[customerId]`; middleware would only need to resolve custom host → `customerId` and rewrite.

### DB schema (domains)

**Relevant tables:** `db/schema.ts`

- **`customers`** has: `domain`, `subdomain` (e.g. `business.com`, `chat` for chat.business.com). No `custom_domain` (full host like `chat.business.com`), no `dns_verified_at`, no `custom_domain_added_at`.
- **`orders`** has: `status` (`pending` | `paid` | …), `paymentProvider`, `paymentId`.
- **No** `customer_domains` (or similar) table yet for domain → customer mapping.

Planned additions (from plan): `customers.dns_verified_at`, and either `customers.custom_domain` or a `customer_domains` table for middleware lookup.

### PayPal integration status

| Item | Status |
|------|--------|
| Checkout UI | User fills form → `POST /api/checkout/lead` (saves to `checkout_leads`) → redirect to PayPal.me with amount + description. No order created at payment time. |
| Order creation | Orders are created by: (1) `POST /api/scan-request` when user adds project (pending order + customer), or (2) `POST /api/admin/orders` (admin creates order + customer, status `paid` for testing). No automatic order from PayPal. |
| Mark paid | **Not implemented.** Admin can list orders at `GET /api/admin/orders` and create new orders via `POST /api/admin/orders`, but there is no PATCH/PUT to set an existing order to `status = 'paid'` (e.g. after confirming payment against a checkout lead). |
| PayPal webhook | None. Docs say PayPal IPN/webhook is planned; Stripe webhook exists at `POST /api/webhooks/stripe` and sets `orders.status = 'paid'`. |

So: **PayPal = redirect only.** To get to “mark paid” without a webhook: need admin UI that lists checkout leads + orders, and an endpoint like `PATCH /api/admin/orders/[id]` with `{ status: 'paid', paymentId?, paymentProvider: 'paypal' }` (and optionally link lead → order when creating order from lead).
