## Conventions

- **Owner**: `FS` (full-stack), `BE`, `FE`, `Ops`
- **Improve existing** = ship on current architecture; **Automation + new** = expand pipeline / infra
- **Product split:** **AI chatbot** plans (`starter-bot`, `chatbot-1y`, `chatbot-2y`) = hands-off automation (Stripe webhook → `auto_crawl` → jobs → DNS/go-live). **Website-builder** SKUs (`starter`, `new-build`, `redesign`) = separate service; no auto-crawl enqueue from webhook.
- **Detail:** `docs/PRODUCTION-READINESS-CHECKLIST.md` (**post-launch priorities & bands A/B/C**), `docs/PLATFORM-GAPS-ROADMAP.md`, `docs/EMAIL-TRIGGERS-AND-DRAFTS.md`, `docs/CHAT-CONTEXT.md`.

---

## 1 — Product & funnel (shipped)

- [x] **Landing** — Hero, how it works, pricing, FAQ, scan modal, theme toggle, particles background
- [x] **Pre-checkout scan** — `POST /api/scan` (Firecrawl), tier / page estimate flow
- [x] **Stripe Checkout** — `POST /api/checkout/stripe`, order + customer rows, redirect to Stripe
- [x] **Checkout UX** — plan on success URL; chatbot vs website copy, ETA, dashboard/email expectations
- [x] **Clerk** — sign-in/up, dashboard session, webhook user sync
- [x] **Stripe webhook** — `checkout.session.completed`, idempotency (`stripe_events`), **chatbot plans** enqueue `auto_crawl_customer`
- [x] **Pricing integrity** — server-only amounts via `lib/checkout-pricing`; optional client `amountCents` logged; 400 on bad pages/plan
- [x] **Public demo chat** — `/chat/demo`, hybrid keyword + LLM, lead capture → `demo_chat_leads` (`016-demo-chat-leads.sql`), `POST /api/chat/demo/lead`
- [x] **Customer chat** — `/chat/c/[customerId]`, streaming `POST /api/chat`, branding from customer metadata
- [x] **Admin** — orders list (`ADMIN_EMAILS`), manual fulfillment paths as documented
- [x] **Credits / Firecrawl** — usage tracking, manual crawl where applicable

---

## 2 — Automation pipeline (shipped)

- [x] **Auto-crawl after pay** — webhook → job `auto_crawl_customer` → Firecrawl → `content` rows
- [x] **Background crawl progress** — `customers.crawl_progress` jsonb; Firecrawl poll writes phase/status; dashboard refresh (5s manual / 15s when active); Training + mobile rescan show live status
- [x] **Post-crawl emails** — “content ready” + “Add this CNAME” (Resend) from crawl success path
- [x] **Go-live** — job dedupe `go_live_*`, `lib/go-live` (CNAME verify, Vercel domain attach), status transitions, **“chatbot is live”** email on success
- [x] **Go-live API** — `POST` enqueue; `GET` poll job + `customerStatus`; **`GET ?dnsProbe=1`** read-only `dnsCheck` without enqueue
- [x] **DNS self-check UI** — `GoLiveButton`: “Check DNS now” (full job) + “Check DNS record only (no attach yet)” (probe)
- [x] **Payment / abandon emails** — reminder sequence (cron), checkout visit tracking + abandonment email
- [x] **Clerk welcome** — `user.created` email path (Resend)

---

## 3 — Dashboard & UX (shipped)

- [x] **Milestone toasts** — payment confirmed, first content indexed, go-live; ref sync to avoid duplicate “content ready” on manual crawl
- [x] **Automation job panel** — crawl + go-live jobs with status labels and failed hint
- [x] **Failed job UX** — toast on crawl/go-live `failed` with `lastError` snippet + dismiss
- [x] **Website-plan stepper** — same four automated milestones as chatbot with website-specific labels (parallel email-led build)
- [x] **Desktop dashboard layout** — compact `xl` layout: stepper, next-step card, sidebar, chat preview (`DesktopStepper`, `DesktopNextStepCard`, `CustomerChat` preview paths)
- [x] **Design system notes** — `DESIGN_SYSTEM.md` (spacing, typography, cards, single primary CTA discipline)
- [x] **shadcn-style UI** — Card, Button, Badge, dialogs; Tailwind + theme
- [x] **Onboarding / user prefs** — migrations through `015-user-onboarding.sql` (per schema product scope)

---

## 4 — Backend reliability & AI (shipped)

- [x] **Crawl robustness** — shared Firecrawl runner; env timeouts/poll; `FIRECRAWL_CRAWL_PAGE_MAX` / `AUTO_CRAWL_MAX_PAGES`; auto-crawl limit follows `estimated_pages`; structured `crawl_outcome` / `crawl_filter_shortfall` logs; dashboard `crawlShortfallHint` when indexed pages lag estimate
- [x] **Job observability** — structured `job_*` JSON logs (`job_claimed`, `job_succeeded`, `job_retry_scheduled`, `job_failed_permanent`) with `jobId`, `dedupeKey`, `customerId`, `orderId`
- [x] **Admin job visibility** — `GET /api/admin/jobs?status=failed&limit=50`
- [x] **Chat context** — `lib/chat-context.ts` + `docs/CHAT-CONTEXT.md`; env-tunable caps; stable page order; `POST /api/chat` uses shared helpers (stuffing semantics)

---

## 5 — Documentation & handoff (shipped)

- [x] **TECH-SPEC.md** — stack, routes, schema overview
- [x] **CHAT-CONTEXT.md** — stuffing behavior and limits
- [x] **EMAIL-TRIGGERS-AND-DRAFTS.md** — live triggers + manual `/api/email` types + gap note (Stripe vs Resend receipt)
- [x] **PLATFORM-GAPS-ROADMAP.md** — parity vs full chatbot platforms
- [x] **ACQUISITION-HANDBOOK.md** — DD entry point, subprocessors, doc map
- [x] **ARCHITECTURE-AND-FLOWS.md**, **DEVELOPER-GUIDE.md**, **MAINTENANCE-AND-DEPENDENCIES.md**, **docs/README.md** index
- [x] **PROJECT-UPDATES.md** — changelog for major doc/product updates

---

## 6 — Moving forward: automation & email gaps

- [x] **Transactional email on Stripe paid** — Resend on `checkout.session.completed` via `lib/send-payment-received-email.ts` (`OrderConfirmationEmail`). Opt out: `SKIP_PAYMENT_RECEIVED_EMAIL=1`.
- [x] **Email audit closure** — `docs/EMAIL-TRIGGERS-AND-DRAFTS.md` updated for Stripe payment row + env notes.
- [x] **Cron / job runner — stuck `running` jobs** — `recoverStuckRunningJobs()` in `lib/jobs.ts` (default `JOBS_STUCK_AFTER_MINUTES=90`); runs at start of `GET /api/cron/jobs`; requeue/fail via existing `markJobFailed` (alerts unchanged on permanent fail). **Still open:** external paging/Slack beyond email alerts.
- [ ] **P2 RAG** — chunking, embeddings, pgvector or hosted vector store; replace / augment char-cap stuffing in `/api/chat` with top-k similarity retrieval (see `docs/CHAT-CONTEXT.md`).

---

## 7 — Owner experience & platform depth (aligned with product strategy)

> **Single narrative:** `docs/PRODUCTION-READINESS-CHECKLIST.md` §5 (bands A–C + coming soon). This section is the engineering checklist; do not treat it as “maybe never.”

### Band A — after launch, high buyer expectation

- [ ] **Persisted chat logs** — tenant-scoped threads/messages; retention; export/delete; privacy/DPA hooks (`docs/legal/`)
- [ ] **Owner “messages” dashboard** — inbox-style UI on top of logs (search, filters, conversation view); not admin-only raw tables
- [ ] **Owner analytics v1** — events (session, message, optional thumbs); aggregates + simple charts; start with conversations/week

### Founder vision (parallel / pull-forward — see `docs/PRODUCTION-READINESS-CHECKLIST.md` §2.5)

> **Shipped (April 2026):** server-side slash expansion + UI chips; optional visitor lead gate + `customer_chat_leads` + dashboard **`visitorLeads`**. See **`docs/CUSTOMER-CHAT-VISITOR-FEATURES.md`**.

- [x] **Slash commands on customer chat** — `/about`, `/pricing`, `/blog`, etc.: server expansion in `POST /api/chat` + chips in `CustomerChat.tsx` (`lib/chat-slash-commands.ts`)
- [x] **Visitor lead capture on `CustomerChat`** — `CustomerChatLeadGate`, `POST /api/chat/customer-lead`, table `customer_chat_leads`, dashboard card (export to CSV = future)

### Band B — monetize (upsell)

- [ ] **Knowledge beyond crawl** — PDF/upload, manual FAQ/snippets, structured facts; ingestion; merge into chat context (pairs with **P2 RAG**, §6); **paid add-on** positioning

### Band C — plan and ship in steps

- [ ] **Human handoff** — v1: escalate → collect email/message → notify owner (email/Slack) + transcript link; later: ticket CRM integrations
- [ ] **Visitor identity** — optional email in widget; session stitching; CRM export; consent + retention in privacy policy

### Coming soon (market honestly; build when ready)

- [ ] **Prompt A/B or versioning** — versioned prompts, buckets, outcome logging
- [ ] **Multi-channel** — WhatsApp/SMS adapters; same chat core

---

## 8 — Moving forward: security, ops & polish

- [x] **Public API audit** — `docs/SECURITY-AND-API-AUDIT.md` refreshed (April 2026); per-IP rate limit on `POST /api/scan/roast`; per-IP + middleware forward for `GET /api/chat/resolve-by-host`; documented auth matrix; residual: unclaimed-order signed token (optional later)
- [ ] **Secrets & DD hygiene** — env inventory, rotation, gitleaks (acquirer checklist in `docs/ACQUISITION-HANDBOOK.md`)
- [ ] **Owner dashboard modernization** — visual/IA refresh (nav, density, messages area when Band A ships); **use design references** (Figma/screenshots) as implementation target — see `docs/PRODUCTION-READINESS-CHECKLIST.md` §6
- [ ] **Mobile dashboard polish** — stepper/onboarding modal vs checklist widget (product decision)
- [x] **Production readiness doc** — `docs/PRODUCTION-READINESS-CHECKLIST.md` rewritten (April 2026); run its §3 checks before each major launch

---

## 9 — Differentiation & growth (not optional long-term)

- [ ] **Rich chat UI cards** — **priority** for differentiated visitor UX; see `docs/CHATBOT-RICH-UI-AND-CARDS-PLAN.md` and `docs/PRODUCTION-READINESS-CHECKLIST.md` §4 (typically after §3 ops + alongside Band A / P2 RAG per §6 order)
- [ ] **Landing experiments** — `docs/landing-page-plan.md` follow-ups, A/B copy
- [ ] **Internal workflow** — keep `docs/INTERNAL-WORKFLOW.md` aligned with automation as behavior changes
