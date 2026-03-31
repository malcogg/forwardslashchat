## Immediate TODOs (Next 7–14 days)

### Conventions
- **Owner**: `FS` (full-stack), `BE`, `FE`, `Ops`
- **Estimate**: rough active time; assumes access to Stripe/Vercel/Neon/Clerk dashboards

---

## P0 — Payments + Security

- **Compute Stripe amount server-side** (ignore client `amountCents`)
  - **Owner**: FS
  - **Estimate**: 3–5h
  - **Files**: `app/api/checkout/stripe/route.ts`, `lib/pricing.ts`, `lib/validation.ts`

- **Webhook idempotency + strict payment checks**
  - **Owner**: FS
  - **Estimate**: 4–8h
  - **Files**: `app/api/webhooks/stripe/route.ts`, `db/schema.ts` (+ migration)

- **Persist Stripe IDs on orders**
  - **Owner**: FS
  - **Estimate**: 2–4h
  - **Files**: `db/schema.ts`, `app/api/checkout/stripe/route.ts`, `app/api/webhooks/stripe/route.ts`

- **Review all public API routes for data leaks**
  - **Owner**: FS
  - **Estimate**: 2–3h
  - **Scope**: `app/api/**`

---

## P1 — Automation

- **Move Firecrawl crawl to background job**
  - **Owner**: BE
  - **Estimate**: 1–2 days
  - **Notes**: pick Inngest or QStash; add retries and progress tracking

- **Auto-run crawl on payment confirmation**
  - **Owner**: BE
  - **Estimate**: 4–6h

- **Auto-domain attach retry loop**
  - **Owner**: BE/Ops
  - **Estimate**: 6–10h

---

## P2 — Real RAG

- **Chunking + embeddings + retrieval**
  - **Owner**: BE
  - **Estimate**: 3–5 days
  - **Notes**: pgvector vs external vector DB; add evaluation prompts

---

## P3 — UX

- **Mobile-first stepper & “What’s next?” panel**
  - **Owner**: FE
  - **Estimate**: 1–2 days

- **Self-serve DNS verification UI**
  - **Owner**: FE/BE
  - **Estimate**: 1–2 days

