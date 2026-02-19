# ForwardSlash.Chat – App Overview

**Everything about the app: what we built, what we use, what’s next.**  
Single source of truth for the product, tech stack, and roadmap.

Last updated: February 2026

---

## Services We Use

| Category | Service | Purpose | Config / Notes |
|----------|---------|---------|----------------|
| **Hosting** | Vercel | App deployment, serverless, cron | GitHub → Vercel auto-deploy |
| **Database** | Neon Postgres | Persistent data (users, orders, customers, content) | `DATABASE_URL` in env |
| **ORM** | Drizzle | Type-safe DB access, migrations | `db/` folder |
| **Auth** | Clerk | Sign up, sign in (Google, email) | `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` |
| **Payments** | PayPal | Primary checkout (redirect to PayPal.me) | Lead saved first; manual payment confirmation |
| **Payments** | Stripe | Checkout + webhooks (update later) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Email** | Resend | Welcome, payment reminder, order confirmation | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Web Scraping** | Firecrawl | Crawl customer websites → markdown for chat | `FIRECRAWL_API_KEY` |
| **AI / Chat** | OpenAI | LLM for customer chatbots (RAG) | `OPENAI_API_KEY` |
| **AI SDK** | Vercel AI SDK | `useChat`, `streamText` for chat UI | `ai`, `@ai-sdk/openai` |
| **Scheduling** | Cal.com | 1-on-1 strategy calls | `NEXT_PUBLIC_STRATEGY_CALL_URL` |
| **Analytics** | Vercel Analytics | Page views, events | `@vercel/analytics` |

### Env Vars Quick Reference

```
# Required for full flow
DATABASE_URL=
FIRECRAWL_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# PayPal: redirect to paypal.me; no webhook yet

# Cron (Vercel)
CRON_SECRET=

# Admin
ADMIN_EMAILS=
```

---

## What We’ve Built (MVP Done)

### Landing & Conversion
- **Landing page** – Hero, URL input, Scan button
- **Roast modal** – Light homepage fetch, age/tech “roast”, page estimate
- **Pricing section** – Page tiers (<50, 50–200, 200–500, 500+), 1–2 years, dynamic price
- **Checkout** – Form (name, email, phone, business, domain, website), plan + add-ons
- **Lead capture** – `POST /api/checkout/lead` saves form before payment
- **PayPal** – Redirect to PayPal.me with amount; manual confirmation

### Auth & Dashboard
- **Clerk** – Google + email sign up, protected `/dashboard`, `/admin`
- **Dashboard** – Order status, customer info, chatbot URL, DNS block, CNAME copy
- **Firecrawl crawl** – “Build my chatbot” triggers crawl, saves to `content`

### Chat
- **Demo** – `/chat/demo` with keyword-based answers (Demo Coffee)
- **Customer chat** – `/chat/c/[customerId]` + `/api/chat/customer/[customerId]` RAG with crawled content
- **Streaming** – AI SDK `streamText`, OpenAI

### Emails (Resend)
- **Welcome** – Clerk webhook `user.created` → welcome email
- **Payment reminder** – Vercel cron daily → users 2+ days with no paid order
- **Order confirmation** – Template exists; needs trigger on payment

### Backend
- **DB schema** – users, scans, orders, customers, checkoutLeads, content, credit_usage
- **APIs** – orders, dashboard, customers, crawl, scan, roast, checkout/lead, webhooks

---

## Quick Wins

| Task | Effort | Impact |
|------|--------|--------|
| Admin “Mark paid” button | Low | Manually set `orders.status = 'paid'` from checkout lead |
| Send order-confirmation email on mark paid | Low | Use existing `OrderConfirmationEmail` when status → paid |
| Payment reminder: use checkout leads | Low | Remind leads who didn’t pay (instead of only Clerk users) |
| Stripe Checkout button on page | Medium | Add Stripe alongside PayPal; webhook already exists |
| Thank-you email template | Low | Simple “We got your payment” message |
| DNS instructions email | Low | Send CNAME block + provider links when order is paid |

---

## Full Automation Roadmap

### Phase 1: Payment Confirmation
1. **PayPal webhook** – IPN or webhooks → set `orders.status = 'paid'`
2. **Or** – Admin “Mark paid” + create order from lead (manual bridge)
3. **Order creation** – When paid: create order + customer from lead, link to user
4. **Order confirmation email** – Trigger `OrderConfirmationEmail` on payment

### Phase 2: Emails End-to-End
1. Thank-you email (payment received)
2. DNS instructions email (CNAME block + link to dashboard)
3. Delivery email (chatbot live, URL)
4. Payment reminder for checkout leads (no sign-up yet)

### Phase 3: DNS & Go-Live
1. **DNS verification** – `POST /api/dns/verify` (DoH CNAME check)
2. **Dashboard** – “Verify DNS” button, status display
3. **Domain → customer** – Table + middleware for `chat.business.com`
4. **Vercel domain** – API to add customer domains
5. **“Go live” button** – Requires DNS verified + content crawled; adds domain, sets delivered

### Phase 4: Self-Serve Flow
1. Post-payment redirect to sign-up (if not signed in)
2. Sign-up → dashboard with order pre-loaded
3. User triggers crawl from dashboard
4. User adds CNAME, clicks Verify DNS
5. User clicks Go Live when ready
6. Delivery email sent automatically

---

## Payment Flow (Current + Target)

### Current
1. User fills checkout → `POST /api/checkout/lead` saves lead
2. Redirect to PayPal (or Stripe) with amount
3. User pays externally
4. **Manual:** Check PayPal, create order + customer, mark paid
5. **Manual:** Send thank-you, dashboard link

### Target (Full Automation)
1. Same checkout + lead capture
2. PayPal webhook or Stripe `checkout.session.completed`
3. Create order + customer from lead, set `status = 'paid'`
4. Send order confirmation email
5. User signs up (or already signed in) → dashboard with order
6. User triggers crawl → content saved
7. User verifies DNS → Go Live → delivery email

---

## Email Templates (Resend)

| Template | Trigger | Status |
|----------|---------|--------|
| Welcome | Clerk `user.created` | ✅ Live |
| Payment reminder | Vercel cron (users 2+ days, no paid order) | ✅ Live |
| Order confirmation | Payment received | Template ✅, trigger ❌ |
| Thank-you | Payment received | ❌ To build |
| DNS instructions | Order paid, DNS add-on or self-setup | ❌ To build |
| Delivery | Chatbot live | ❌ To build |

---

## Pricing (Current)

| Tier | 1 Year | 2 Years |
|------|--------|---------|
| < 50 pages | $550 | $850 |
| 50–200 pages | $550 → $1,980 (linear) | 2yr multiplier |
| 200–500 pages | $1,980 → $3,200 (linear) | 2yr multiplier |
| 500+ | Contact us | Contact us |

Add-ons: DNS help +$99, AI chatbot (Starter plan), Advanced SEO, Logo, Blog.

---

## Reference Docs

- [TECH-SPEC.md](./TECH-SPEC.md) – Technical spec: stack, schema, API reference
- [RESEND-RECEIVING-SETUP.md](./RESEND-RECEIVING-SETUP.md) – Receive emails at hello@forwardslash.chat
- [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) – Security audit, endpoint auth, action items
- [FIRST-ORDER-READINESS.md](./FIRST-ORDER-READINESS.md) – Pre-launch checklist
- [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) – DONE vs TODO (may be outdated)
- [APP-STATE-AND-AUTOMATION-PLAN.md](./APP-STATE-AND-AUTOMATION-PLAN.md) – Automation details
- [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) – Fulfillment SOP
- [INVESTOR-PITCH.md](./INVESTOR-PITCH.md) – Investor overview
