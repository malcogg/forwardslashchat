# ForwardSlash.Chat – App Flow & Audit Guide

**Purpose:** Single run-down of the full app flow, where triggers and notifications fire, where loading/delays/animations exist (or are missing), and how to verify the product works after someone pays. Use this to audit, test with a friend’s domain, and ship a working product.

Last updated: February 2026

---

## 1. Inline flow of the app

End-to-end paths through the product:

### Path A: Anonymous visitor → Roast → Checkout (no account)

1. **Homepage** → User enters URL in hero or clicks “Scan your site” → **Scan modal** opens.
2. **Scan modal – Enter URL** (if dashboard-style with no URL) or **Roasting** (if URL already set, e.g. from hero).
3. **Roasting** → Typing bubbles + `POST /api/scan/roast` (light scan, no Firecrawl). Min display ~2.5s (`MIN_ROAST_DISPLAY_MS`). Roast result (age, reasons, `estimatedPages`) shown.
4. **Roast results** → Bullets reveal with ~400ms stagger (`BULLET_DISPLAY_MS`). CTA: “Pay $X (2-yr, ~N pages) →” links to `/checkout?plan=chatbot-2y&pages=N&url=…`; 500+ pages → “Contact us” → `/#pricing`. Optional: “Create free account” / “Continue to dashboard”.
5. **Checkout** → User lands with plan + pages + optional url. Form: name, email, phone, business, domain, website. If **signed in**: `POST /api/checkout/visit` fires (for abandonment reminder). “Pay” → `POST /api/checkout/stripe` (saves lead, creates order + customer) → redirect to **Stripe Checkout** with amount + description. 6. **Stripe** → User pays with card. Webhook marks order `paid`. Redirect to `/thank-you?orderId=...`.

### Path B: Visitor → Roast → Sign up → Dashboard (no payment required)

1. Same as Path A through **Roast results**.
2. User clicks “Create free account” → **Clerk sign-up** → After sign-up, redirect to `/dashboard`. `PENDING_SCAN_URL_KEY` in sessionStorage holds `{ url, estimatedPages }`.
3. **Dashboard load** → Any signed-in user can load the dashboard (payment not required). `GET /api/dashboard` and `GET /api/orders/me` return their data or empty. If sessionStorage has pending URL and no `orderId`, `POST /api/scan-request` runs (creates **pending** order + customer). Redirect to `/dashboard?orderId=…`.
4. **Dashboard** shows their project(s); status “Payment pending”. They can scan more sites, see their list, etc. **Payment is only required to run “Build my chatbot”** (crawl + go live). Until then they stay on the dashboard with pending order(s).

### Path C: Signed-in user with paid order → Build chatbot → Chat live

1. **Dashboard** with `orderId` and `order.status === 'paid'`. Status steps: Payment confirmed → Content & training → DNS setup → Chatbot live.
2. **Build my chatbot** → `POST /api/customers/[id]/crawl` (Firecrawl crawl, saves to `content`, updates customer status). **Emails sent:** “Your chatbot content is ready” + “Add this CNAME to go live”.
3. **Chat preview** → Dashboard shows “Try your chatbot” → `/chat/c/[customerId]`. RAG uses `content` for that customer.
4. **DNS / Go live** → Currently manual (you add domain in Vercel; no in-app “Verify DNS” or “Go live” automation yet).

### Path D: Public chat (no login)

1. **Shareable link** → `/chat/c/[customerId]`. Page fetches `GET /api/chat/customer/[customerId]` (business name, theme). **Loading:** “Loading…” text only (no skeleton). Then **CustomerChat** with RAG + streaming.

---

## 2. Flow summary (one-line list)

- **Homepage** → URL → **Scan modal** (roasting → roast results → Pay CTA or Sign up / Dashboard).
- **Sign up** → Clerk → **Dashboard** (no payment required). Pending URL → **scan-request** → pending **order + customer**; user sees their project(s).
- **Checkout** → Form → **Stripe** (`POST /api/checkout/stripe`) → Stripe Checkout → order + customer created, webhook marks paid.
- **Mark order paid** (Neon or Stripe webhook) → **Cron** sends “Payment confirmed – build your chatbot” (once per order).
- **Dashboard** → **Build my chatbot** (only when paid) → **Crawl** → **Crawl complete + DNS emails** → **Chat** at `/chat/c/[customerId]`.
- **Public chat** → `/chat/c/[customerId]` → load customer → RAG chat.

---

## 3. Triggers – where they run

| Trigger | When / Where | What runs |
|--------|----------------|-----------|
| **Clerk `user.created`** | Webhook: `POST /api/webhooks/clerk` | Create/sync user in DB; send **Welcome** email (Resend). |
| **Checkout page load** | Checkout page `useEffect` (signed-in only) | `POST /api/checkout/visit` (upsert `checkout_visits`). |
| **Pay button** | Checkout “Pay” click | `POST /api/checkout/stripe` → Stripe Checkout URL → redirect. |
| **Dashboard load with pending URL** | Dashboard `useEffect`, no `orderId` | `POST /api/scan-request` → create order + customer → redirect with `orderId`. |
| **Build my chatbot** | Dashboard “Build my chatbot” button | `POST /api/customers/[id]/crawl` → Firecrawl → save content → send **Crawl complete** + **DNS instructions** emails. |
| **Stripe payment** | Webhook: `POST /api/webhooks/stripe` (`checkout.session.completed`) | Update `orders.status = 'paid'` for `metadata.orderId`. (Order must already exist.) |
| **Cron: payment-reminder** | Vercel cron daily 14:00 UTC | `GET /api/cron/payment-reminder` → 3-step sequence (day 2, 7, 14) to users with **no paid order**; uses `reminder_sent` (migration 007). |
| **Cron: checkout-reminder** | Vercel cron daily 15:00 UTC | `GET /api/cron/checkout-reminder` → “Finish your AI chatbot order” to users who **visited checkout 4–24h ago** and have no paid order; uses `checkout_visits` (migration 006). |
| **Cron: paid-notification** | Vercel cron every 10 min | `GET /api/cron/paid-notification` → (1) **Newly paid:** `orders.status = 'paid'` and `paid_notification_sent_at IS NULL` → send “Payment confirmed – build your chatbot”, set `paid_notification_sent_at`. (2) **Build reminder:** paid 2+ days ago, notification already sent, **no content** → send “Build your bot to get started”, set `build_reminder_sent_at`. Requires migration 008. |

**Important:** Checkout uses **Stripe** only. Stripe webhook sets `orders.status = 'paid'` when payment completes. For manual testing, you can still set `orders.status = 'paid'` in Neon.

---

## 4. Notifications (emails + in-app)

### Emails (Resend)

| Email | Trigger | Recipient | Status |
|-------|---------|-----------|--------|
| Welcome | Clerk `user.created` | New user | ✅ Live |
| Payment reminder 1/2/3 | Cron payment-reminder (day 2, 7, 14) | User, no paid order | ✅ Live (needs migration 007) |
| Checkout reminder | Cron checkout-reminder (visit 4–24h ago) | User, no paid order | ✅ Live (needs migration 006) |
| Payment confirmed – build your chatbot | Cron paid-notification (newly paid) | Order owner (`users.email` via `orders.userId`) | ✅ Live (needs migration 008) |
| Build your bot to get started | Cron paid-notification (paid 2+ days, no content) | Same | ✅ Live |
| Your chatbot content is ready | After crawl completes | Order owner | ✅ Live |
| Add this CNAME to go live | Same request as above | Order owner | ✅ Live |
| Order confirmation (thanks) | Manual: you mark paid | Customer | Template + `POST /api/email` (manual) |
| Chatbot delivered | Manual: when live | Customer | Template + `POST /api/email` (manual) |

### In-app

- **Dashboard:** Status steps (Payment confirmed, Content & training, DNS setup, Chatbot live). No toast system; errors shown inline (e.g. crawl error).
- **Checkout:** Save error shown inline if `POST /api/checkout/lead` fails.
- **Chat:** No in-app notifications; loading state is “Loading…” on customer chat page.

---

## 5. Delays, animations, and skeleton loading (audit)

Use this to avoid rushed flows and add skeletons where needed.

### Scan modal

| Step | Delays / animations | Gaps |
|------|---------------------|------|
| Roasting | Typing bubbles (typewriter ~65ms/char), min ~2.5s before results, pulsating orb | ✅ Feels deliberate |
| Roast results | Staggered bullet reveal (~400ms), then CTA | ✅ Good |
| Scanning (full scan) | Progress bar, “Scanning your site…”, rotating message, “Typically 2–8 min” | ✅ Present |
| Results / Pricing | No artificial delay | Optional: short delay before “See your price” |
| Error | Retry button | OK |

### Checkout

| Area | State | Gaps |
|------|--------|------|
| Page load | No skeleton; form renders immediately | Optional: brief skeleton for plan/amount if needed |
| Pay click | No loading spinner on button before redirect | **Add:** Disable button + “Saving…” or spinner while `POST /api/checkout/lead` runs |

### Dashboard

| Area | State | Gaps |
|------|--------|------|
| Initial load | **Skeleton:** sidebar + main area with `animate-pulse` placeholders while `GET /api/dashboard` | ✅ Good |
| Pending URL → scan-request | No overlay; request runs in useEffect, then redirect | Optional: “Creating project…” overlay so user knows something is happening |
| Build my chatbot | **crawling** state; button disabled, crawl error shown on failure | ✅ OK; could add progress or “This may take a few minutes” |
| Chat preview | Inline iframe / link to `/chat/c/[customerId]` | OK |

### Chat pages

| Page | State | Gaps |
|------|--------|------|
| `/chat/c/[customerId]` | **Loading:** “Loading…” text only | **Add:** Skeleton (message area + input) instead of plain text |
| `/chat/demo` | `isLoading` from useChat; UI disables send while loading | ✅ OK |

### Other

| Page | State | Gaps |
|------|--------|------|
| Admin | Loading state then table | ✅ OK |

**Recommended next steps for “not rushed” and polish:**

1. **Checkout:** Disable Pay button and show “Saving…” or spinner while `handlePay` is in flight.
2. **Customer chat page:** Replace “Loading…” with a skeleton (e.g. header + message bubbles placeholder + input bar).
3. **Dashboard:** Optional “Creating your project…” overlay when `POST /api/scan-request` is in progress (before redirect).

---

## 6. Post-payment: making sure the product works

After someone pays, the chain should be:

1. **Order is `paid`** (Stripe webhook or manual in Neon).
2. **Order has `userId`** (required for cron to send “Payment confirmed – build your chatbot” to the right email).
3. **Customer record exists** (order has a customer; created by scan-request or by admin).
4. **User can open dashboard** with that order (e.g. `/dashboard?orderId=…` or first order loaded).
5. **Build my chatbot** works: crawl runs, content saved, emails sent.
6. **Chat works:** `/chat/c/[customerId]` loads and RAG responds using that content.

### PayPal (current) – no order created at payment

- Lead is in `checkout_leads`; payment is on PayPal.
- You must **create order + customer** and set **status = paid** and link to a **user** (so cron can email them). Options:
  - **A)** Create user by email (e.g. invite to sign up or create user record), then create order with that `userId`, status `paid`, and customer. No public “create from lead” UI yet; admin `POST /api/admin/orders` creates order with **admin’s** userId (for testing only).
  - **B)** Mark an **existing** order (e.g. from scan-request) as paid in Neon: set `orders.status = 'paid'`, optionally set `payment_provider = 'paypal'`, `payment_id = '...'`. Then cron will send “Payment confirmed – build your chatbot” to the order’s user.

### Stripe

- Order must **exist** before checkout (with `metadata.orderId`). Webhook sets `status = 'paid'`. If you create order + customer when user starts checkout (e.g. from lead), you need to create the user first or use existing user and pass `orderId` into Stripe Checkout session.

### Checklist: “Working product after pay”

- [ ] **Migrations:** 006 (checkout_visits), 007 (reminder_sent), 008 (paid_notification_sent_at, build_reminder_sent_at) applied in Neon.
- [ ] **Cron:** Vercel crons configured with `CRON_SECRET`; paid-notification runs every 10 min.
- [ ] **Resend:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` set; no bounces.
- [ ] **Order → user:** Every paid order has `userId` so paid-notification cron can find `users.email`.
- [ ] **Dashboard:** Paid user with order sees “Build my chatbot”; clicking it runs crawl and sends crawl + DNS emails.
- [ ] **Chat:** After crawl, `/chat/c/[customerId]` returns 200 and chat uses content; no “Chatbot not found”.
- [ ] **Manual step:** You have a repeatable way to go from “PayPal payment received” to “order paid + linked to user” (Neon or future admin “Mark paid” from lead).

---

## 7. How to test with a friend’s domain

1. **Roast only (no account)**  
   Use their URL on homepage → Scan → confirm roast shows, page estimate, and “Pay $X” or “Contact us” for 500+.

2. **Checkout → lead**  
   Go to checkout with plan + pages + their URL; fill form with your (or their) email; click Pay → confirm redirect to PayPal and that a row appears in `checkout_leads`.

3. **Full flow (paid)**  
   - Create a test user (sign up) or use existing.  
   - Create order + customer for that user (e.g. via scan-request: go to dashboard with pending URL, or create in Neon and set `user_id`).  
   - Set `orders.status = 'paid'` in Neon (and run migration 008 if not already).  
   - Wait for cron or trigger `GET /api/cron/paid-notification` with `Authorization: Bearer YOUR_CRON_SECRET` → check inbox for “Payment confirmed – build your chatbot”.  
   - Open dashboard with that order → click “Build my chatbot” → wait for crawl → check “Your chatbot content is ready” + “Add this CNAME to go live” emails.  
   - Open `/chat/c/[customerId]` → send messages and confirm RAG answers from their site content.

4. **Reminders**  
   - Payment reminder: use a user created 2+ days ago with no paid order; run payment-reminder cron; check for “Still want your AI chatbot?”.  
   - Checkout reminder: sign in, visit `/checkout`, leave; 4–24h later run checkout-reminder cron; check for “Finish your AI chatbot order”.

---

## 8. Quick reference – key files

| Concern | File(s) |
|--------|---------|
| Roast + scan modal flow | `components/ScanModal.tsx` |
| Checkout form + lead + visit | `app/checkout/page.tsx`, `app/api/checkout/lead/route.ts`, `app/api/checkout/visit/route.ts` |
| Dashboard load + scan-request | `app/dashboard/page.tsx` |
| Crawl + emails | `app/api/customers/[id]/crawl/route.ts` |
| Cron | `app/api/cron/payment-reminder/route.ts`, `app/api/cron/checkout-reminder/route.ts`, `app/api/cron/paid-notification/route.ts` |
| Webhooks | `app/api/webhooks/clerk/route.ts`, `app/api/webhooks/stripe/route.ts` |
| Customer chat loading | `app/chat/c/[customerId]/page.tsx` |
| Vercel cron schedule | `vercel.json` |

---

Use this doc to audit flow, add missing loading/skeletons, confirm triggers and notifications, and run a friend’s domain test so the product is solid after payment.
