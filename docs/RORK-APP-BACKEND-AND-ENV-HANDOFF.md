# Rork App — Backend Services & Environment Variables Handoff

This document is for the team building the **Rork-style mobile app** (or any native/React Native client) that will talk to the ForwardSlash.Chat backend. It lists all backend services, API endpoints, authentication, and **every environment variable** required so the app can be configured once and work 100%.

---

## 1. Base URL & App Identity

| Purpose | Value / Env Var | Notes |
|--------|------------------|--------|
| **API base URL** | `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` | Production: `https://forwardslash.chat`. Staging: your Vercel preview URL. Local: `http://localhost:3000`. All API calls from the app should use this base (e.g. `{base}/api/orders/me`). |
| **Clerk frontend origin** | Same as base URL | Clerk’s “Authorized parties” must include your app’s origin (e.g. `https://forwardslash.chat`, `http://localhost:3000`) so token-based auth works. |

**Recommendation:** In the mobile app, store one config value such as `API_BASE_URL` (or `NEXT_PUBLIC_APP_URL`) and use it for every request. The web app derives it from `process.env.NEXT_PUBLIC_APP_URL` or `VERCEL_URL`.

---

## 2. Authentication (Clerk)

All dashboard and order-related APIs require a **signed-in user**. The backend accepts auth in two ways:

1. **Cookie** (browser): session cookie from Clerk.
2. **Bearer token** (mobile / serverless): `Authorization: Bearer <clerk_session_token>`.

The backend uses Clerk’s `authenticateRequest()` so the same APIs work for both. The mobile app must:

- Use the **Clerk SDK** (React Native or similar) for sign-in/sign-up.
- Obtain a **session token** (e.g. `getToken()` from Clerk) and send it on every request:  
  `Authorization: Bearer <token>`.

### Env vars (backend — already set on ForwardSlash)

| Variable | Purpose | Where to get it |
|----------|---------|------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key for Clerk (frontend/mobile) | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Server-side Clerk API | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Verify Clerk webhooks (e.g. user.created) | Clerk Dashboard → Webhooks → Endpoint → Signing Secret |

**For the Rork app (mobile):** You only need the **publishable key** in the app (same as web). The backend already has the secret and webhook secret. Ensure Clerk is configured with your app’s bundle ID / package name and allowed redirect URLs so sign-in works.

---

## 3. Backend API Endpoints (All Require Auth Unless Noted)

Assume **base URL** = `NEXT_PUBLIC_APP_URL` (e.g. `https://forwardslash.chat`). Send `Authorization: Bearer <clerk_session_token>` on every request except where marked **Public**.

### 3.1 Dashboard & orders (core for Rork app)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| **GET** | `/api/dashboard?orderId=<uuid>` | Bearer | Single-order dashboard: `order`, `customer`, `contentCount`. Omit `orderId` to get user’s first order. |
| **GET** | `/api/orders/me` | Bearer | List of user’s orders with `order`, `customer`, `contentCount`, `estimatedPages` per row. Use for “Your Sites” and stats. |
| **GET** | `/api/orders/[id]` | Bearer | Single order by ID (ownership checked). |
| **DELETE** | `/api/orders/[id]` | Bearer | Delete order (and cascade). Use with care. |

**Response shapes (summary):**

- **GET /api/dashboard**: `{ order, customer, contentCount }`.  
  `order`: id, status, amountCents, bundleYears, planSlug, …  
  `customer`: id, businessName, domain, subdomain, websiteUrl, status, lastCrawledAt, …
- **GET /api/orders/me**: Array of `{ order, customer, contentCount, estimatedPages }`.

### 3.2 Add site / scan (create new “site” = order + customer)

| Method | Path | Auth | Body | Purpose |
|--------|------|------|------|--------|
| **POST** | `/api/scan-request` | Bearer | `{ "url": "https://example.com", "estimatedPages": 50 }` | Create pending order + customer; returns `{ orderId, customerId }`. No payment yet. |

After this, the app can open dashboard (or site detail) with `orderId`.

### 3.3 Single order / customer actions

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| **POST** | `/api/customers/[id]/crawl` | Bearer | Trigger crawl for that customer (Build my chatbot / Rescan). Respects 7-day rescan cooldown. |
| **POST** | `/api/customers/[id]/go-live` | Bearer | Verify CNAME for `subdomain.domain` and add domain to Vercel; set customer status to `delivered`. |

### 3.4 Checkout (payments)

| Method | Path | Auth | Body | Purpose |
|--------|------|------|------|--------|
| **POST** | `/api/checkout/stripe` | None | See below | Create Stripe Checkout Session; returns `{ url }` to redirect user to Stripe’s hosted checkout. |

Checkout body (required): `firstName`, `email`, `phone`, `businessName`, `domain`, `websiteUrl`, `planSlug`, `addOns` (array), `amountCents`. Optional: `orderId` to link to existing order.  
Plan slugs: e.g. `chatbot-2y`, `starter-bot`, `starter`, `new-build`, `redesign`.

### 3.5 Chat (for “Test Chatbot” / embed)

| Method | Path | Auth | Purpose |
|--------|------|------|--------|
| **GET** | `/api/chat/customer/[customerId]` | **Public** | Minimal customer info for chat UI: `businessName`, `primaryColor`. |
| **POST** | `/api/chat/route` | (internal) | Main chat completion (used by chat widget). |
| **POST** | `/api/chat/customer/[customerId]/route` | (internal) | Customer-scoped chat. |

For the Rork app, “Test Chatbot” can open: `https://{NEXT_PUBLIC_APP_URL}/chat/c/[customerId]` in a WebView or browser. No env vars needed in the app for that beyond the base URL.

### 3.6 Other (admin / cron / webhooks — not for mobile)

- **Webhooks:** Stripe (`/api/webhooks/stripe`), Clerk (`/api/webhooks/clerk`), Resend (`/api/webhooks/resend`) — server-to-server only.
- **Cron:** payment-reminder, checkout-reminder, paid-notification — called by Vercel with `CRON_SECRET`.
- **Admin:** `/api/admin/orders`, `/api/admin/orders/from-lead` — gated by `ADMIN_EMAILS`.

The Rork app does **not** need to call these; they are backend-internal.

---

## 4. Environment Variables — Full Checklist

Use this list to configure the **backend** (e.g. Vercel) and, where applicable, the **Rork app** (e.g. build-time or runtime config).

### 4.1 Required for backend (and for app to work end-to-end)

| Variable | Used by | Purpose |
|----------|--------|---------|
| `DATABASE_URL` or `POSTGRES_URL` | Backend | Neon Postgres connection string (pooled URL for serverless). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Backend + **App** | Clerk publishable key (app uses for login; backend for auth). |
| `CLERK_SECRET_KEY` | Backend | Clerk server-side API. |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Backend | Clerk webhook verification (e.g. welcome email on signup). |
| `STRIPE_SECRET_KEY` | Backend | Create Checkout Sessions and verify payments. |
| `STRIPE_WEBHOOK_SECRET` | Backend | Verify Stripe webhooks (`checkout.session.completed` → mark order paid, etc.). |
| `OPENAI_API_KEY` | Backend | LLM for customer chatbots. |
| `FIRECRAWL_API_KEY` | Backend | Site crawling (scan, roast, crawl). |
| `RESEND_API_KEY` | Backend | Transactional email (welcome, post-payment, DNS instructions, etc.). |
| `RESEND_FROM_EMAIL` | Backend | From address (e.g. `ForwardSlash.Chat <hello@forwardslash.chat>`). |

### 4.2 Required for “Go live” (domain automation)

| Variable | Used by | Purpose |
|----------|--------|---------|
| `VERCEL_ACCESS_TOKEN` | Backend | Add customer domains to Vercel project. |
| `VERCEL_PROJECT_ID` | Backend | Target Vercel project (e.g. `prj_xxx`). |
| `CNAME_TARGET` | Backend | Optional. CNAME value we expect (default `cname.vercel-dns.com` or your Vercel DNS target). |

Without these, “Go live” will return 503 with a message to add the vars (see `docs/VERCEL-DOMAIN-AUTOMATION-SETUP.md`).

### 4.3 Optional but recommended

| Variable | Used by | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_APP_URL` | Backend + **App** | Canonical base URL (e.g. `https://forwardslash.chat`). Used for redirects, links in emails, and as API base in the app. |
| `NEXT_PUBLIC_STRATEGY_CALL_URL` | Backend + **App** | Cal.com (or similar) link for “Help & Support” / strategy call (default: `https://cal.com/forwardslash/30min`). |
| `ADMIN_EMAILS` | Backend | Comma-separated emails for admin routes. |
| `RESEND_WEBHOOK_SECRET` | Backend | If you use Resend webhooks. |
| `EMAIL_API_SECRET` | Backend | If you call `POST /api/email` from cron. |
| `CRON_SECRET` | Backend | Authorization for Vercel cron jobs. |

### 4.4 What the Rork app needs in its own config

- **API base URL:** Same as `NEXT_PUBLIC_APP_URL` (e.g. `https://forwardslash.chat`). Use for all `/api/*` requests.
- **Clerk publishable key:** Same as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (for Clerk SDK in the app).
- **Optional:** `NEXT_PUBLIC_STRATEGY_CALL_URL` if you show “Help & Support” / strategy call link.

No Stripe publishable key is required for the current flow (checkout is server-redirect to Stripe Checkout). If you later add Stripe Elements in-app, add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

---

## 5. Data Model (Short Reference)

- **users** — Synced from Clerk (`externalId` = Clerk user id). Used to tie orders to a user.
- **orders** — One per “purchase” (chatbot or website). Fields: `id`, `userId`, `status` (pending | paid | processing | delivered | failed), `amountCents`, `planSlug`, `bundleYears`, etc.
- **customers** — One per order: chatbot/website config. Fields: `id`, `orderId`, `businessName`, `domain`, `subdomain`, `websiteUrl`, `status` (e.g. content_collection → crawling → dns_setup → delivered), `lastCrawledAt`, `estimatedPages`, etc.
- **content** — Crawled pages per customer (for chat retrieval).
- **scans** — Roast/scan results (can be anonymous before payment).

Status flow (chatbot): Order `pending` → `paid` (after Stripe) → Customer `content_collection` → `crawling` → `dns_setup` → `delivered` (live).

---

## 6. Making the App “100% Working” — Checklist

- [ ] **Base URL:** App uses `NEXT_PUBLIC_APP_URL` (or equivalent) for every API call.
- [ ] **Auth:** Clerk SDK integrated; session token sent as `Authorization: Bearer <token>` on all dashboard/orders/customers/crawl/go-live and scan-request requests.
- [ ] **Clerk authorized parties:** Backend’s Clerk config includes your app’s origin(s) (production + staging + local if needed).
- [ ] **Dashboard data:** Implement “Dashboard” and “Site detail” using `GET /api/dashboard?orderId=` and `GET /api/orders/me`.
- [ ] **Add site:** “Add Site” calls `POST /api/scan-request` with `url` and optional `estimatedPages`; then navigate to new `orderId` (e.g. site detail).
- [ ] **Rescan / Build chatbot:** “Rescan” or “Build my chatbot” calls `POST /api/customers/[id]/crawl` (id = customer id). Handle 7-day cooldown in UI if you show it.
- [ ] **Go live:** “Go live” calls `POST /api/customers/[id]/go-live` (backend needs `VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID`).
- [ ] **Checkout:** When user pays, either open web checkout (`POST /api/checkout/stripe` → redirect to returned `url`) or implement native flow that ends at Stripe Checkout / Payment Sheet; webhook will set order to `paid`.
- [ ] **Test Chatbot:** Link or WebView to `https://{BASE_URL}/chat/c/[customerId]` when status is delivered.
- [ ] **Env on backend:** All required vars set in Vercel (or your host); optional vars for cron, admin, Resend webhooks, and `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_STRATEGY_CALL_URL` as desired.

---

## 7. Quick Reference — Env Vars for Rork App Team

**Backend (Vercel / host):**

```
DATABASE_URL=                    # Neon Postgres (pooled)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
FIRECRAWL_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
VERCEL_ACCESS_TOKEN=             # For go-live
VERCEL_PROJECT_ID=               # For go-live
NEXT_PUBLIC_APP_URL=https://forwardslash.chat
NEXT_PUBLIC_STRATEGY_CALL_URL=   # Optional
CRON_SECRET=                     # Optional, for cron
ADMIN_EMAILS=                    # Optional
```

**Rork app (mobile) config:**

```
API_BASE_URL = NEXT_PUBLIC_APP_URL   # e.g. https://forwardslash.chat
CLERK_PUBLISHABLE_KEY = NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
STRATEGY_CALL_URL = NEXT_PUBLIC_STRATEGY_CALL_URL  # optional
```

Use this document as the single source of truth for backend services and env vars when building out the Rork app so the app is 100% correctly configured.
