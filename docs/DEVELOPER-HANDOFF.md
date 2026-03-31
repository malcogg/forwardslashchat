# Developer Handoff – ForwardSlash.Chat

**Last updated:** February 2026

This doc is for a developer taking over the app. It covers what you need to run it, where things live, and what’s documented (or missing).

---

## 1. What you need to run the app

### Environment variables

Create `.env.local` in the project root. **Never commit secrets.**

| Variable | Where to get it | Required for |
|----------|-----------------|--------------|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) – use **pooled** URL | DB, Drizzle |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys | Auth, sign-in |
| `CLERK_SECRET_KEY` | Same | Auth |
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com) | Checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → signing secret | Mark orders paid |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → API Keys | Checkout UI |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com) | Chat and AI |
| `FIRECRAWL_API_KEY` | [Firecrawl](https://firecrawl.dev) | Site scanning |
| `RESEND_API_KEY` | [Resend](https://resend.com) | Order/paid emails |
| `ADMIN_EMAILS` | Your email(s), comma-separated | Access to `/admin` |

Optional: `POSTGRES_URL` (some setups use this instead of `DATABASE_URL`). Vercel: set all of the above in Project → Settings → Environment Variables.

There is no single `.env.example` in the repo; this list is the source. See also [BACKEND-SETUP.md](./BACKEND-SETUP.md) and [PAYMENT-SETUP.md](./PAYMENT-SETUP.md).

### First run (local)

```bash
npm install
npm run db:push    # Sync schema from db/schema.ts to Neon
npm run dev
```

- **Sign-in:** Needs Clerk keys; without them auth won’t work.
- **Payments:** Needs Stripe keys; use test mode and Stripe CLI for webhooks:  
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- **Cron / reminders:** Not run locally; they run in production (Vercel cron or similar). See [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md).

---

## 2. Where things live in the codebase

| What | Where |
|------|--------|
| **Pricing tiers (source of truth)** | `lib/pricing.ts` – amounts, tier keys, Stripe price IDs |
| **DB schema** | `db/schema.ts` – tables: users, scans, orders, customers, content, credit_usage, etc. |
| **Checkout flow** | `app/checkout/` – scan → tier selection → Stripe session |
| **Stripe webhook** | `app/api/webhooks/stripe/route.ts` – marks order paid, can trigger emails |
| **Dashboard** | `app/dashboard/` – order list, “Build my chatbot”, crawl, chat preview |
| **Admin** | `app/admin/` – list orders, trigger crawl (protected by `ADMIN_EMAILS`) |
| **Customer chat** | `app/chat/c/[customerId]/page.tsx` + `app/api/chat/` (and customer chat API) |
| **Landing** | `app/page.tsx` + `components/landing/` – hero, pricing, FAQ |
| **Email** | Resend; trigger points and drafts in [EMAIL-TRIGGERS-AND-DRAFTS.md](./EMAIL-TRIGGERS-AND-DRAFTS.md) |

---

## 3. Docs to read (in order)

1. **[DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md)** (this file) – env and first run  
2. **[APP-OVERVIEW.md](./APP-OVERVIEW.md)** – product, stack, services  
3. **[APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md)** – full flow, triggers, notifications, audit  
4. **[pricing-and-bundles.md](./pricing-and-bundles.md)** – pricing tiers, add-ons, messaging  
5. **[TECH-SPEC.md](./TECH-SPEC.md)** – structure, schema, API list  
6. **[BACKEND-SETUP.md](./BACKEND-SETUP.md)** – DB, Clerk, API routes  
7. **[PAYMENT-SETUP.md](./PAYMENT-SETUP.md)** – Stripe (and PayPal if used)  
8. **[EMAIL-TRIGGERS-AND-DRAFTS.md](./EMAIL-TRIGGERS-AND-DRAFTS.md)** – when emails fire and copy  
9. **[SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md)** – auth and security notes  
10. **[dev-instructions.md](./dev-instructions.md)** – what to do when a new order comes in  

Full index: [docs/README.md](./README.md).

---

## 4. Handoff checklist (you)

- [ ] Clone repo, `npm install`, add `.env.local` with all variables above  
- [ ] Run `npm run db:push` against a dev Neon project  
- [ ] Confirm sign-in works (Clerk)  
- [ ] Confirm checkout → Stripe test payment → webhook marks order paid  
- [ ] Confirm `/admin` loads (add your email to `ADMIN_EMAILS`)  
- [ ] Read APP-FLOW-AND-AUDIT and run through the audit checklist once  
- [ ] Know where to change pricing: `lib/pricing.ts` + [pricing-and-bundles.md](./pricing-and-bundles.md)  

---

## 5. Gaps / docs we don’t have (yet)

These would help a new developer or ops person; add them as you need them:

| Gap | Suggestion |
|-----|------------|
| **Deploy checklist** | One-pager: Vercel env, build, cron URLs, webhook URLs, post-deploy smoke test. |
| **Clerk setup** | How to create Clerk app, redirect URLs, webhook (if used) for user sync. |
| **Neon runbook** | How to run migrations in Neon SQL Editor (which files, in what order). Partially in SETUP-DATABASE-MIGRATIONS.md. |
| **“Mark order paid” runbook** | If webhook fails: how to mark an order paid manually (DB or admin UI). |
| **Stripe product/price IDs** | Where Stripe product and price IDs are set (dashboard vs code); doc or comment in `lib/pricing.ts`. |
| **Resend domains** | Which domain is used for sending (e.g. hello@forwardslash.chat), how to add/verify. |

Once you add any of these, link them from this section and from [docs/README.md](./README.md).
