## Conventions
- **Owner**: `FS` (full-stack), `BE`, `FE`, `Ops`
- **Improve existing** = ship on current architecture
- **Automation + new** = expand pipeline / infra

---

## A — Improve existing features (front + back)

### Backend (payments)
- [x] **Stripe checkout amount** — server-only via `lib/checkout-pricing`; client `amountCents` optional (logged if mismatch); 400 on invalid pages/plan.

### Frontend (dashboard & funnel)
- [x] **Milestone toasts** — poll-driven toasts for payment confirmed, first content indexed, go-live; manual crawl still syncs ref to avoid duplicate “content ready” toast.
- [x] **Automation job panel** — Training shows `automationJobs` (crawl + go-live) with status labels and failed hint.
- [x] **Failed job UX (baseline)** — toast on crawl/go-live `failed` with `lastError` snippet + dismiss.
- [ ] **Website-plan stepper** — align copy with reality (manual outreach vs bot automation); reduce confusion next to chatbot flow.
- [ ] **Checkout / thank-you** — consistent “what happens next” + ETA for chatbot path (match dashboard).

### Backend (reliability & honesty)
- [ ] **Crawl robustness** — configurable limits, clearer timeouts; align `limit` with plan/pages across scan vs customer crawl.
- [ ] **Job observability** — structured logs (orderId, customerId, job id, dedupeKey); optional admin view of job errors.
- [ ] **Chat context** — document/limit behavior of full-page stuffing until P2 RAG lands.

### Already in good shape (keep as-is while extending)
- Stripe webhook idempotency (`stripe_events`), auto-enqueue `auto_crawl_customer` on paid session.
- Dashboard polling for post-pay crawl + `automationJobs` on `/api/dashboard`.
- Resend emails from `lib/customer-crawl` / flows (crawl complete, DNS, etc.).

---

## B — Add for automation (net-new or major upgrades)

- [ ] **Background crawl progress** — persist “crawl started / N pages / complete” (or Firecrawl job id) for UI; avoid 3m blocking assumptions.
- [ ] **Email every milestone** — paid, crawl started (optional), crawl complete, DNS reminder, go-live success / failure (audit gaps vs Resend templates).
- [ ] **DNS self-check UI** — poll or manual “Check DNS” calling existing go-live path; show propagation hints.
- [ ] **Cron coverage** — ensure job runner retries + alerts on stuck `running` jobs.
- [ ] **P2 RAG** — chunking, embeddings, pgvector (or hosted vector), swap `/api/chat` retrieval from char-cap stuffing to top-k similarity.

---

## C — Legacy / parking lot (from older notes)
- Review public API routes for data leaks (`app/api/**`).
- Mobile-first stepper polish; onboarding modal vs checklist widget (product decision).
