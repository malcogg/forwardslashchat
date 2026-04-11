# ForwardSlash.Chat – App Overview

**Product and stack snapshot.** For **launch checklist, post-launch priorities, and owner-experience roadmap** (chat logs, messages UI, analytics, upsells), use **`docs/PRODUCTION-READINESS-CHECKLIST.md`** and **`TODO.md` §6–§9** — they override older sections below where they conflict.

Last updated: April 2026

---

## Services We Use

| Category | Service | Purpose | Config / Notes |
|----------|---------|---------|----------------|
| **Hosting** | Vercel | App deployment, serverless, cron | GitHub → Vercel auto-deploy |
| **Database** | Neon Postgres | Persistent data (users, orders, customers, content) | `DATABASE_URL` in env |
| **ORM** | Drizzle | Type-safe DB access, migrations | `db/` folder |
| **Auth** | Clerk | Sign up, sign in (Google, email) | `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` |
| **Payments** | Stripe | Checkout + webhooks (chatbot SKUs) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Email** | Resend | Welcome, payment reminder, order confirmation | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Web Scraping** | Firecrawl | Crawl customer websites → markdown for chat | `FIRECRAWL_API_KEY` |
| **AI / Chat** | OpenAI | LLM for customer + demo chat; context from crawled pages (**pgvector RAG** + stuffing fallback — `docs/CHAT-CONTEXT.md`, `TODO.md` §6) | `OPENAI_API_KEY` |
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
# Cron (Vercel)
CRON_SECRET=

# Admin
ADMIN_EMAILS=
```

---

## What we’ve built (shipped — summary)

### Landing & conversion
- Landing, roast/scan modal (`/api/scan/roast`), pricing tiers, Stripe Checkout, leads/visits tracking

### Auth & dashboard
- **Clerk** — sign-in/up; protected `/dashboard` and `/fs-ops/...` (admin UI uses `ADMIN_PATH_TOKEN` + `ADMIN_EMAILS`; legacy `/admin` is removed)
- **Dashboard** — order/customer status, crawl/go-live automation, job panel, DNS guidance, chat preview

### Automation
- Stripe webhook → paid → **auto-crawl** (jobs/cron), progress in DB, post-crawl + CNAME + **go-live** (DNS verify, Vercel domain attach), milestone emails

### Chat
- **Demo** — `/chat/demo` (LLM + keyword helpers, lead capture)
- **Customer chat** — `/chat/c/[customerId]`, streaming `/api/chat`, branding; host-based routing via middleware + `resolve-by-host`

### Backend
- Neon + Drizzle; see `db/schema.ts` and `docs/TECH-SPEC.md` for tables and APIs

---

## What’s next (product strategy)

Do **not** use the old “Phase 1–4” / PayPal-primary narrative below; it is **historical**.

1. **Launch hygiene** — `docs/PRODUCTION-READINESS-CHECKLIST.md` §3 (legal review, prod smoke, secrets, alerting, refunds).
2. **Owner experience** — Band A: **persisted logs**, **messages UI**, **analytics v1** (`TODO.md` §7).
3. **Quality & differentiation** — **Extra knowledge** (PDF/FAQ, paid pack — `docs/PRODUCT-ROADMAP.md` §4), **rich chat cards** (`TODO.md` §9, `docs/CHATBOT-RICH-UI-AND-CARDS-PLAN.md`). Crawl RAG is shipped (`TODO.md` §6).
4. **Monetize depth** — Band B extra knowledge; Bands C + coming soon per checklist §5.

---

## Historical note (obsolete planning)

The following bullets described an **older** PayPal-forward, partially manual plan. **Stripe + automation above are live.**

<details>
<summary>Archived “phases” (do not follow)</summary>

- PayPal-primary checkout and manual mark-paid
- Email triggers listed as missing (many are now implemented — see `docs/EMAIL-TRIGGERS-AND-DRAFTS.md`)
- Phase 1–4 roadmap items subsumed by current codebase + `DEPLOYMENT.md`

</details>

---

## Email (source of truth)

Use **`docs/EMAIL-TRIGGERS-AND-DRAFTS.md`** for which templates fire when. Do not rely on the stale table that was here previously.

---

## Pricing (Current)

| Tier | 1 Year | 2 Years |
|------|--------|---------|
| Up to 50 pages | $799 | $1,099 |
| 51–200 pages | $1,499 | $2,099 |
| 201–500 pages | $2,999 | $3,999 |
| 500+ | Contact us | Contact us |

Add-ons: DNS help +$99, AI chatbot (Starter plan), Advanced SEO, Logo, Blog.

---

## Reference Docs

- [TECH-SPEC.md](./TECH-SPEC.md) – Technical spec: stack, schema, API reference
- [RESEND-RECEIVING-SETUP.md](./RESEND-RECEIVING-SETUP.md) – Receive emails at hello@forwardslash.chat
- [EMAIL-TRIGGERS-AND-DRAFTS.md](./EMAIL-TRIGGERS-AND-DRAFTS.md) – Email triggers, subjects, body drafts
- [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) – Security audit, endpoint auth, action items
- [FIRST-ORDER-READINESS.md](./FIRST-ORDER-READINESS.md) – Pre-launch checklist
- [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) – Launch + post-launch priorities (source of truth with `TODO.md`)
- [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md) – Full flow, triggers, audit checklist
- [APP-STATE-AND-AUTOMATION-PLAN.md](./APP-STATE-AND-AUTOMATION-PLAN.md) – Automation details
- [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) – Fulfillment SOP
- [INVESTOR-PITCH.md](./INVESTOR-PITCH.md) – Investor overview
