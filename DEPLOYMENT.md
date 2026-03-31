## Deployment & Subdomain Automation (Vercel)

### Environments
Maintain distinct envs:
- **Development**: local + Stripe test mode + dev Clerk instance
- **Production**: Vercel + Stripe live mode + prod Clerk instance

---

## Required environment variables (production)

### Core
- `DATABASE_URL` (Neon pooled URL recommended)
- `NEXT_PUBLIC_APP_URL` (e.g. `https://www.forwardslash.chat`)

### Auth (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET` (for `/api/webhooks/clerk`)

### Payments (Stripe)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Crawl + LLM
- `FIRECRAWL_API_KEY`
- `OPENAI_API_KEY`

Note: this codebase currently uses the single-key vars above. Multi-key rotation (`*_API_KEYS`) is a planned improvement (see `API_KEYS.md`).

### Email (Resend)
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET` (if using inbound webhooks)

### Cron
- `CRON_SECRET` (Bearer token required by `/api/cron/*`)

### Background jobs (auto-fulfillment)
- `JOBS_MAX_PER_RUN` (optional, default `5`)
- `AUTO_CRAWL_MAX_PAGES` (optional, default `200`, max `500`)

### Domain automation
- `VERCEL_ACCESS_TOKEN`
- `VERCEL_PROJECT_ID`
- Optional:
  - `CNAME_TARGET` (defaults to `cname.vercel-dns.com`)
  - `NEXT_PUBLIC_CNAME_TARGET` (recommended: set to the same value as `CNAME_TARGET` so the dashboard/email instructions match)

---

## Stripe setup
- Create a webhook endpoint in Stripe:
  - `POST https://www.forwardslash.chat/api/webhooks/stripe`
  - Subscribe to: `checkout.session.completed` (and optionally async variants)
- Set the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

---

## Vercel domain automation flow
1. Customer adds `CNAME chat → cname.vercel-dns.com` (or your configured `CNAME_TARGET`).
2. Backend verifies DNS via Google DoH.
3. Backend calls Vercel Domains API to attach `chat.customer.com` to the project.
4. Vercel provisions SSL automatically.
5. Customer status becomes `delivered`.

Key endpoint:
- `POST /api/customers/[id]/go-live`

### What you (the operator) must configure once

- `VERCEL_ACCESS_TOKEN`: a Vercel token that can add domains to the project
- `VERCEL_PROJECT_ID`: the target Vercel project id (e.g. `prj_...`)
- Optional `CNAME_TARGET`:
  - Keep default `cname.vercel-dns.com`, or
  - Use a branded alias (e.g. `cname.forwardslash.chat`) that CNAMEs to `cname.vercel-dns.com`

Setup guide: `docs/VERCEL-DOMAIN-AUTOMATION-SETUP.md`.

---

## Cron endpoints
All cron endpoints require:
- `Authorization: Bearer ${CRON_SECRET}`

Configured in Vercel Cron (recommended):
- `/api/cron/paid-notification` — every 10–15 minutes
- `/api/cron/checkout-reminder` — daily
- `/api/cron/payment-reminder` — daily
- `/api/cron/jobs` — every 1–2 minutes (processes background jobs like auto-crawl after payment)

---

## Production smoke test checklist
- Create Stripe test payment in staging (or live $1 product in prod, if acceptable).
- Confirm webhook marks order `paid`.
- Trigger crawl; confirm `content` rows created.
- Verify `/chat/c/[customerId]` works.
- Add a test domain + CNAME; verify `/go-live` attaches domain and loads chat on that host.

