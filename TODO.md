## Conventions
- **Owner**: `FS` (full-stack), `BE`, `FE`, `Ops`
- **Improve existing** = ship on current architecture
- **Automation + new** = expand pipeline / infra
- **Product split:** **AI chatbot** plans (`starter-bot`, `chatbot-1y`, `chatbot-2y`) = hands-off automation (Stripe webhook → `auto_crawl` → jobs → DNS/go-live). **Website-builder** SKUs (`starter`, `new-build`, `redesign`) = separate service; no auto-crawl enqueue from webhook.

---

## A — Improve existing features (front + back)

### Backend (payments)
- [x] **Stripe checkout amount** — server-only via `lib/checkout-pricing`; client `amountCents` optional (logged if mismatch); 400 on invalid pages/plan.

### Frontend (dashboard & funnel)
- [x] **Milestone toasts** — poll-driven toasts for payment confirmed, first content indexed, go-live; manual crawl still syncs ref to avoid duplicate “content ready” toast.
- [x] **Automation job panel** — Training shows `automationJobs` (crawl + go-live) with status labels and failed hint.
- [x] **Failed job UX (baseline)** — toast on crawl/go-live `failed` with `lastError` snippet + dismiss.
- [x] **Website-plan stepper** — same 4 automated milestones as chatbot (crawl/DNS/live) with website-specific labels; copy matches Stripe `auto_crawl` + parallel email-led website build.
- [x] **Checkout / thank-you** — plan on success URL; chatbot vs website copy with ETA and dashboard/email expectations.

### Backend (reliability & honesty)
- [x] **Crawl robustness** — shared Firecrawl runner + env timeouts/poll; `FIRECRAWL_CRAWL_PAGE_MAX` / `AUTO_CRAWL_MAX_PAGES` operator cap; auto-crawl limit follows `estimated_pages` (no stale 200 default); structured `crawl_outcome` / `crawl_filter_shortfall` logs; dashboard `crawlShortfallHint` when indexed pages lag estimate.
- [x] **Job observability** — structured `job_*` JSON logs (`job_claimed`, `job_succeeded`, `job_retry_scheduled`, `job_failed_permanent`) with `jobId`, `dedupeKey`, `customerId`, `orderId`; `GET /api/admin/jobs?status=failed&limit=50` for recent failures.
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
