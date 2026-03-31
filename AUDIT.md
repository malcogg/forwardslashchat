## ForwardSlash.Chat — Technical Audit (2026-03-31)

### Executive summary
ForwardSlash.Chat is a **one-time-payment website chatbot builder**: users enter site details, pay via **Stripe Checkout**, crawl their website via **Firecrawl**, and get a branded chatbot deployed at `chat.<their-domain>` on Vercel. The `landing-page` branch contains working Stripe + domain automation, but there are several **security, correctness, and reliability gaps** that must be addressed before calling the system production-ready at scale.

### Step 0 — Architecture overview (current)
- **Frontend**: Next.js 15 App Router (`app/`) with a marketing site + `/checkout`, `/thank-you`, `/dashboard`, `/chat/demo`, and hosted customer chat route(s).
- **Auth**: Clerk (`@clerk/nextjs`) with middleware protection and a Clerk webhook for welcome email.
- **Payments**: Stripe Checkout Session created server-side (`app/api/checkout/stripe/route.ts`) and confirmed via webhook (`app/api/webhooks/stripe/route.ts`).
- **Data**: Neon Postgres with Drizzle (`db/schema.ts`, `db/index.ts`).
- **Crawl/Content**: Firecrawl crawl called synchronously with polling (`app/api/customers/[id]/crawl/route.ts`) and stored in `content` table.
- **Chat**: OpenAI via AI SDK (`app/api/chat/route.ts`) streams responses using *all* stored content concatenated into the prompt.
- **Domain automation**: DNS verification (Google DoH) + Vercel Domains API to attach customer domain (`app/api/customers/[id]/go-live/route.ts`).
- **Automation**: Vercel Cron endpoints (`app/api/cron/*`) for reminder/notification email sequences; Resend for email.
- **Multi-tenant routing**: `middleware.ts` rewrites requests by hostname to `/chat/c/[customerId]` after resolving host → customer in `/api/chat/resolve-by-host`.

### Repo map (important paths)
- **Routes**: `app/api/**`, `app/dashboard/page.tsx`, `app/checkout/page.tsx`, `app/thank-you/page.tsx`
- **Core domain**: `db/schema.ts`, `lib/validation.ts`, `lib/pricing.ts`, `lib/credits.ts`
- **Webhooks**: `app/api/webhooks/stripe`, `app/api/webhooks/clerk`, `app/api/webhooks/resend`
- **Domain automation**: `app/api/customers/[id]/go-live`

---

## Step 1 — Stripe audit

### What exists today
- **Checkout session creation**: `POST /api/checkout/stripe`
  - Creates a `checkout_leads` row, then creates `orders` + `customers`, then creates a Stripe Checkout Session (`mode: payment`) and redirects to `session.url`.
  - Sets `metadata.orderId` on the Checkout Session.
- **Webhook**: `POST /api/webhooks/stripe`
  - Verifies signature with `Stripe.webhooks.constructEvent`.
  - On `checkout.session.completed`, sets `orders.status = paid`, `paymentProvider=stripe`, `paymentId = payment_intent|session.id`.

### Findings (gaps / risks)
#### P0 — Client-tamperable pricing (critical)
`/api/checkout/stripe` trusts `amountCents` from the client. A user can submit `$1.00` for a `$3,999` plan and get a valid Stripe session for that amount.
- **Fix**: compute amount server-side from `(planSlug, pages, addOns)` using shared pricing code; ignore client amount except maybe for telemetry.

#### P0 — Webhook idempotency / replay
Webhook handler updates the order but does not record processed Stripe event IDs. Stripe will retry deliveries; duplicates should be explicitly safe.
- Current behavior is *mostly* idempotent (setting `status=paid` repeatedly), but it’s incomplete:
  - no detection of out-of-order events
  - no audit trail of event IDs
- **Fix**: persist `stripe_event_id` processing state (table `stripe_events` or columns on `orders`) and short-circuit duplicates.

#### P0 — Missing payment status checks
`checkout.session.completed` can fire for sessions that are complete but not fully paid in some async scenarios.
- **Fix**: require `session.payment_status === "paid"` (and/or handle `checkout.session.async_payment_succeeded`).

#### P1 — Missing “source of truth” mapping
Order updates rely exclusively on `metadata.orderId`. There’s no storage of:
- `stripe_checkout_session_id`
- `stripe_payment_intent_id`
- `stripe_customer_id` (optional)
This makes reconciliation, refunds, chargebacks, and support harder.

#### P1 — No refunds/chargebacks handling
No handlers for refund events (e.g. `charge.refunded`) and no admin tooling to mark refunded/canceled and revoke service if needed.

#### P1 — Tax/VAT not implemented
No Stripe Tax, no address collection, no invoice/receipt policy beyond Stripe defaults.

#### P2 — Price/product modeling
Current implementation uses ad-hoc `price_data` per checkout rather than Stripe Products/Prices.
- Acceptable early-stage, but eventually you’ll want:
  - Products/Prices for analytics and consistent receipts
  - promotion codes / coupons
  - optional add-on line items

---

## Step 2 — Full automation & completion audit

### Crawl/index pipeline
- Crawl runs synchronously (poll loop up to 3 minutes). This is fragile for larger sites and serverless execution time limits.
- No background job orchestration; retries/backoff are minimal.
- Current “RAG” is prompt stuffing (concatenating all `content` rows), which will break with content size.

### Domain + SSL
- DNS verification uses Google DoH; good start, but:
  - no explicit retry workflow
  - no distinction between “CNAME correct but Vercel needs verification” and “CNAME missing”
  - no tracking of domain attach failures (Vercel API responses)

### Reliability / recovery
- No centralized retry strategy for Firecrawl/OpenAI/Stripe/Vercel calls.
- No circuit-breaker; repeated failures can burn credits and degrade UX.
- Observability is mostly console logs; no structured logging, tracing, or alerting.

### Post-purchase customer experience
- Thank-you page pushes sign-up and dashboard; good.
- Dashboard UX is much improved (mobile shell exists), but “automation” still expects manual steps:
  - user clicks “Build my chatbot”
  - user manually adds DNS record
  - user clicks “Go live”
For “100% automated”, you need at minimum: background crawl+index on payment completion + guided DNS + automated domain attach when verified (with reminders).

---

## Step 3 — User flow redesign (mobile + desktop) — findings
- There are now effectively **two products**: “chatbot” plans and “website services” add-ons.
- Mobile dashboard architecture exists (`components/dashboard/*`), but core funnel still has multiple branching paths.
- Primary improvement needed: an explicit stepper that always answers:
  1) “What’s next?”
  2) “How long will it take?”
  3) “What do I do now?”

---

## Step 4 — Documentation & planning
This audit comes with:
- `ROADMAP.md` — prioritized phases (P0–P3)
- `TODO.md` — immediate tasks + estimates
- `API_KEYS.md` — key rotation, rate limiting, failover strategy
- `DEPLOYMENT.md` — deployment + subdomain automation plan

---

## Step 5 — Reliability upgrades (recommended approach)
- Introduce a job orchestrator (e.g. Inngest/QStash) for:
  - crawl
  - extraction/chunking
  - embeddings
  - domain verification retries
  - email workflows
- Add rate-limit + exponential backoff utilities for Firecrawl/OpenAI/Vercel.
- Replace prompt stuffing with retrieval (vector DB or pgvector) + chunking.

---

## Step 6 — Improvement suggestions (high signal)
### Concrete improvements (existing system)
- Compute checkout amount server-side.
- Make Stripe webhooks idempotent and strict about paid state.
- Add durable processing pipeline (jobs) and robust retries.
- Replace concatenated context with chunked retrieval.
- Tighten endpoint auth/authorization boundaries (especially admin/cron/webhooks).

### Higher-level enhancements
- “Self-serve go-live”: realtime DNS verification UI + automatic domain attach when ready.
- Customer content controls: exclude pages, re-crawl, upload docs.
- SLA + support tooling: admin dashboard with event timelines (payment → crawl → domain attach).

