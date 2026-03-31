## API Keys & Third-Party Reliability Strategy

### Goals
- Avoid free-tier lockups and surprise downtime.
- Support **safe key rotation** with zero-downtime deploys.
- Handle rate limits and transient failures gracefully.

---

## Firecrawl

### Paid tier strategy
- Use a paid Firecrawl plan sized for expected crawl volume.
- Maintain at least **two API keys** (primary + secondary) so you can rotate without downtime.

### Environment variables
- **Current**: `FIRECRAWL_API_KEY`
- **Planned**: `FIRECRAWL_API_KEYS` (comma-separated keys, e.g. `fc_live_a,fc_live_b`)
- Optional per-plan limits:
  - `FIRECRAWL_CREDITS_FREE`, `FIRECRAWL_CREDITS_HOBBY`, etc.

### Rotation
1. Add new key to `FIRECRAWL_API_KEYS` as the second entry.
2. Deploy.
3. Switch primary in config (move new key to first position).
4. Deploy.
5. Revoke old key.

### Rate-limit handling
- Implement `fetchWithRetry`:
  - exponential backoff with jitter
  - respect `429` and `Retry-After` headers if provided
  - cap max attempts and total elapsed time

### Circuit breaker
If Firecrawl fails repeatedly (e.g. 10 failures in 5 minutes), temporarily:
- stop auto-crawls
- show a “We’re retrying in X minutes” status in dashboard
and alert ops.

---

## OpenAI

### Paid tier strategy
- Use a paid OpenAI tier and set sane per-request budgets.
- Maintain multiple API keys, similar to Firecrawl:
  - **Current**: `OPENAI_API_KEY`
  - **Planned**: `OPENAI_API_KEYS` (comma-separated keys)

### Key usage policy
- Never expose keys client-side.
- Use a dedicated key for production and a separate key for local/dev.
- Consider a separate key for embeddings vs chat.

### Rate-limit handling
- Retry only on safe errors (429, 5xx, timeouts).
- Backoff + jitter.
- Add request timeouts.

---

## Stripe

### Key strategy
- Keep separate environments:
  - `STRIPE_SECRET_KEY` (test vs live)
  - `STRIPE_WEBHOOK_SECRET` (test vs live endpoint secrets)
- Never share webhook secrets across environments.

### Webhook operational guardrails
- Idempotent event processing.
- Store Stripe identifiers on orders for reconciliation.

---

## Vercel Domains API

### Key strategy
- `VERCEL_ACCESS_TOKEN` should be scoped to the minimum required permissions.
- Prefer a dedicated “automation” token.

### Rate limiting / retries
- Retry on 429/5xx.
- Persist failures to the DB so the system can retry later.

---

## Other paid (or likely paid) services

These aren’t “API keys” in the same sense, but they are core dependencies you should expect to pay for as usage grows:

- **Vercel**: hosting + bandwidth + cron (depending on plan/usage)
- **Neon Postgres**: database (free tiers exist; production usage usually paid)
- **Clerk**: auth (free tiers exist; paid at higher MAU/features)
- **Resend**: outbound email (free tiers exist; paid for volume/dedicated sending)
- **Stripe**: payment processing fees (no monthly fee required, but per-transaction fees apply)

