## ForwardSlash.Chat — Roadmap (Modernization + Production Readiness)

### Principles
- **Security and correctness first** (money + identity + data boundaries).
- **Automation before polish** (remove manual steps).
- **Make failures safe** (idempotency, retries, observability).
- **Mobile-first UX** (most SMB owners will use phones).

---

## Phase 0 (P0) — Ship safety for payments + core security (1–3 days)

### P0.1 Stripe correctness
- **Server-side price calculation**: ignore client `amountCents`; compute from `planSlug/pages/addOns` in `POST /api/checkout/stripe`.
- **Webhook strictness**: only mark `paid` when `payment_status === "paid"` (and support `async_payment_succeeded`).
- **Idempotency**: persist processed Stripe event IDs (table or columns) and short-circuit duplicates.
- **Store Stripe identifiers**: persist `checkout_session_id` and `payment_intent_id` on `orders` for reconciliation.

### P0.2 Endpoint hardening
- Ensure admin/cron/webhook routes have explicit auth:
  - Cron already uses `CRON_SECRET` — verify all cron routes enforce it.
  - Admin already checks `ADMIN_EMAILS` — keep.
  - Webhooks should remain public but signature-verified.
- Remove/lock any unauthenticated data access endpoints (none obvious in landing-page, but re-check before deploy).

### P0.3 Reliability guardrails
- Add standard `fetchWithRetry` util (timeouts, exponential backoff, jitter, max attempts) for Firecrawl/OpenAI/Vercel.

---

## Phase 1 (P1) — Full automation pipeline (3–7 days)

### P1.1 Background jobs
Introduce a job orchestrator (recommended: Inngest or QStash) and move:
- Firecrawl crawl and polling out of request/response path.
- Content processing (chunk/extract) out of request/response path.
- Domain verification retries and Vercel attach retries.

### P1.2 Auto-fulfillment
On `order.paid`:
- enqueue crawl job
- enqueue indexing job
- enqueue “DNS readiness” reminder job

### P1.3 Observability
- Structured logs (request id, customerId, orderId, jobId)
- Basic error alerting for webhook failures + job failures

---

## Phase 2 (P2) — Real RAG (scalable chat quality) (5–10 days)

### P2.1 Chunk + vector retrieval
- Chunk pages into ~500–1,000 token chunks
- Create embeddings
- Store vectors (pgvector or a hosted vector DB)
- Retrieve top-k by similarity per user query

### P2.2 Guardrails
- Prompt injection hardening
- PII redaction rules (optional)
- Safety filters and “unknown” responses

---

## Phase 3 (P3) — UX redesign (mobile + desktop) (3–7 days)

### P3.1 Funnel simplification
- Single primary CTA: scan → plan → checkout → thank-you → dashboard
- Unified stepper in dashboard: Payment → Crawl/Training → Domain → Live

### P3.2 Self-serve domain setup
- Live DNS verification UI
- “Go Live” becomes automatic when DNS verified (button only as override)

---

## Definition of “100% automated”
The product is considered fully automated when:
- Payment confirmed via webhook → crawl + index starts automatically
- DNS status is monitored; domain is attached automatically when verified
- Customer receives emails at each milestone (paid, content ready, domain ready, live)
- No engineer action required for a standard customer order

