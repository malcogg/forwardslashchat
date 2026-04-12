# ForwardSlash.Chat — Production readiness checklist

**Purpose:** Single place for **what is shipped**, **what you need before marketing**, and **what “hands-off” still requires** from you (mostly monitoring, legal review, and optional product depth).

**Email:** Resend · **Hosting:** Vercel · **DB:** Neon Postgres · **Auth:** Clerk · **Payments:** Stripe

Last updated: April 2026

---

## 1. Definition: “Launch-ready” vs “full chatbot SaaS”

| Scope | Meaning |
|--------|---------|
| **Launch-ready (current product)** | Paid chatbot SKUs: Stripe → auto-crawl → emails → DNS/go-live → hosted chat. Customer uses dashboard; you **manage** via `/fs-ops/{ADMIN_PATH_TOKEN}`, Stripe, Vercel, and env — not hand-coding per order. |
| **Roadmap after v1 (parity + your priorities)** | See **§5**: chat logs and an **owner-facing “messages” experience** are strong expectations from buyers; other rows are phased (paid add-ons vs **coming soon**). |
| **Improves answers at scale** | **P2 RAG shipped** (TODO §6): chunking + embeddings + pgvector retrieval + stuffing fallback (`docs/CHAT-CONTEXT.md`). **Next:** owner **extra knowledge** (PDF, FAQs) as a **paid** Band B pack — `docs/PRODUCT-ROADMAP.md` §4. |

---

## 2. DONE — Core product (aligned with `TODO.md` §1–5)

Use this when onboarding someone or answering “is it built?”

### Funnel & conversion
- [x] Landing: hero, how it works, pricing, FAQ, scan modal, theme
- [x] Pre-checkout scan path: `/api/scan/roast` (lightweight) + checkout flow
- [x] Stripe Checkout + server-side pricing (`lib/checkout-pricing`)
- [x] Clerk sign-in/up; dashboard session; user sync webhook
- [x] Stripe webhook: paid orders, idempotency, chatbot plans enqueue auto-crawl
- [x] Demo chat `/chat/demo` + lead capture API
- [x] Customer chat `/chat/c/[customerId]` + streaming `/api/chat` + branding metadata

### Automation
- [x] Auto-crawl after pay; crawl progress in DB; dashboard refresh UX
- [x] Post-crawl + CNAME + go-live emails (Resend)
- [x] Go-live: DNS check, Vercel domain attach, job dedupe, failure UX
- [x] Cron: reminders, job worker, stuck-job recovery (`JOBS_STUCK_AFTER_MINUTES`)

### Dashboard & admin
- [x] Milestones, job panel, failed-job toasts, desktop/mobile layouts
- [x] Admin APIs + UI at **secret path** `/fs-ops/{ADMIN_PATH_TOKEN}` (requires Clerk + `ADMIN_EMAILS`). Legacy `/admin` returns 404.

### Reliability & AI
- [x] Firecrawl runner limits, logging, admin job visibility
- [x] Chat context caps and shared helpers; crawl RAG + stuffing fallback (`lib/chat-context.ts`, `lib/rag-*.ts`, `docs/CHAT-CONTEXT.md`)

### Docs
- [x] Developer handoff, architecture, email map, security audit, platform gaps, user guide (`docs/USER-GUIDE.md`)

---

## 2.5 Founder vision (story vs shipped)

**North star:** Automate turning a **static site** into a **smart assistant** — scan → store → GPT answers on a **customer-dedicated** page/domain; **shortcuts** and **leads** on the live widget.

### Shipped in production customer chat (April 2026)

| Feature | What we built |
|---------|----------------|
| **Slash-style shortcuts** | **`/about`**, **`/pricing`**, **`/blog`**, **`/contact`**, **`/products`**, **`/help`** — **server-side** expansion in **`POST /api/chat`** (`lib/chat-slash-commands.ts`) + pill buttons in **`CustomerChat`**. Unknown `/foo` is passed through to the LLM as normal text. |
| **Visitor lead capture** | **`CustomerChatLeadGate`** before first chat (session **`sessionStorage`** `fs_cust_lead_v1_{customerId}`); **`POST /api/chat/customer-lead`** → **`customer_chat_leads`**; **dashboard** **`visitorLeads`** (90-day summary + recent rows). Skippable like demo. |

**Technical reference:** `docs/CUSTOMER-CHAT-VISITOR-FEATURES.md`.

### Still to iterate (not blockers)

- **Owner-configured** slash aliases or custom commands in dashboard.
- **CSV export** of `customer_chat_leads` from UI (data is in DB; query or add export).
- **Privacy policy** copy refresh if you promise specific retention for visitor-submitted PII (`docs/legal/PRIVACY-POLICY.md`).

**Also still on roadmap:** Band A **persisted chat transcripts** for every message (separate from lead rows) — see §5.

### Default shipping order (finish / ship)

1. **§3 Launch hygiene** — legal smoke + attorney review, prod verification, **secrets** hygiene, **alerting** (Slack/paging if needed), **refund / chargeback** playbook (`TODO.md` §8).
2. **Band A** — **persisted chat logs** + owner **Messages** UI + **light analytics** (owners are not blind).
3. **Rich UI cards** + tune **crawl RAG** — **visitor-visible** structured UI (`TODO.md` §9, `docs/CHATBOT-RICH-UI-AND-CARDS-PLAN.md`); eval chunking/embeddings on real sites (`TODO.md` §6, shipped).
4. **Band B / C** — **paid** extra knowledge (PDF/FAQ uploads, `docs/PRODUCT-ROADMAP.md` §4); **human handoff**; **visitor identity** / CRM export.

### Founder parallel track (status)

**Slash commands + customer-chat leads** are **shipped**; continue with **§3** hygiene, then **Band A** (full message logs / inbox), **rich cards**, **Band B** (paid extra knowledge), **B/C** handoff/identity. Crawl **P2 RAG** is already shipped (§4).

---

## 3. Before first marketing push (operations & trust)

These are **not** big feature builds; they reduce support load and legal risk.

### Legal & policy (site + review)
- [x] Generic **Terms of Service** and **Privacy Policy** drafts live in `docs/legal/` and on-site at `/terms` and `/privacy` (footer links).
- [ ] **Attorney review** for your entity, jurisdiction, and final subprocessors list.
- [ ] Replace placeholder **contact email** / company name in those files if you forked the template.

### Production verification (one-time smoke)
- [ ] Stripe **live** mode: webhook URL, price IDs vs `lib/pricing.ts`, one real card test (or strict test-mode rehearsal).
- [ ] Cron: Vercel cron → `GET /api/cron/jobs` with `CRON_SECRET`.
- [ ] Email: domain verified in Resend; spot-check paid / content-ready / CNAME / live messages (`docs/EMAIL-TRIGGERS-AND-DRAFTS.md`).
- [ ] Custom domain: one end-to-end CNAME → resolve-by-host → chat loads.

### Hands-off operations (TODO.md **§8**)
- [ ] **Secrets hygiene:** env inventory, rotation cadence, optional `gitleaks` in CI — see `docs/ACQUISITION-HANDBOOK.md`.
- [ ] **Failure visibility:** job permanent-fail emails exist; add **Slack/paging** if you want less inbox monitoring (TODO §6 still notes this gap).
- [ ] **Refund / chargeback process:** even if Stripe webhooks for refunds are future work (`AUDIT.md`), define **who** handles support and **how** you revoke or pause service.

### Security (see `docs/SECURITY-AND-API-AUDIT.md`)
- [x] Per-IP rate limit on public **`POST /api/scan/roast`** (env: `SCAN_ROAST_RATE_LIMIT_PER_MINUTE`).
- [x] **`POST /api/scan`** requires sign-in (Firecrawl cost); admin/cron/webhooks use secrets or signatures.
- [ ] Optional: stricter limits on other public endpoints as traffic grows; signed token for order claim (audit “rolling” items).

---

## 4. Product depth you care about next

### P2 RAG (customer-quality upgrade) — shipped
**Status:** Crawl-backed **chunk → embed → pgvector → top-k** is live (`019-content-chunks-rag.sql`, `lib/rag-*.ts`, `POST /api/chat`). Tuning remains (chunk size, overlap, evals on real sites).

**Next related upgrade:** **Band B — extra knowledge** (PDF, pasted FAQ, uploads) merged into the same retrieval path, with **usage limits** and **Stripe add-ons** — see **`docs/PRODUCT-ROADMAP.md` §4**.

**Refs:** `TODO.md` §6, `docs/CHAT-CONTEXT.md`, `docs/PLATFORM-GAPS-ROADMAP.md`.

### Rich UI cards (priority UX)
**Goal:** Differentiated chat experience (structured cards, links, CTAs) beyond plain markdown bubbles.

**Work:**
1. Follow **`docs/CHATBOT-RICH-UI-AND-CARDS-PLAN.md`** — schema for card types, rendering in `CustomerChat` / demo parity.
2. Decide server vs client: structured JSON from model/tooling vs deterministic templates from URLs detected in answers.
3. Ship one vertical slice (e.g. “pricing card” or “link preview”) then expand.

### Nice-to-haves (park after launch or run as small batches)
- Landing experiments (`docs/landing-page-plan.md` if used).
- Keep **`docs/INTERNAL-WORKFLOW.md`** aligned with automation as behavior changes.

---

## 5. Product roadmap — parity vs what owners actually expect

**Keep this section:** it is not optional fluff. Buyers compare you to “chatbot platforms” that already have **history** and **some sense of control**. The table below separates **what to build early**, **what to monetize**, and **what to label “coming soon”** on the marketing site.

### Priority band A — ship after launch (high buyer expectation)

| Area | Why it matters | What “done” roughly means |
|------|----------------|---------------------------|
| **Persisted chat logs** | Owners ask “what did people ask?” for trust, training staff, and disputes. | Schema: **thread + messages** per `customerId`/tenant; **retention** (e.g. 30/90/365 days); **export** (CSV/JSON); **delete** for GDPR-style requests; update **Privacy Policy** + optional **DPA** language. |
| **Owner “messages” UI** | Same data as logs, but **productized**: inbox-style list, search, filter by date, open a conversation — not only raw admin tables. | New **dashboard section** (or sub-route) backed by the same tables; optional **email digest** (“5 new conversations this week”). |
| **Owner analytics (v1)** | Answers “is this thing working?” without a full BI product. | **Event pipeline**: message sent, session started, optional **thumbs up/down** on last bot reply; store aggregates + simple **charts** (volume over time, top topics if you tag or cluster later). Define one headline metric (e.g. **conversations/week**) first; “deflection rate” can wait until you define “resolved.” |

### Priority band B — monetize (clear upsell)

| Area | Notes |
|------|--------|
| **Knowledge beyond crawl** | **Charge for this**: PDF/uploads, **manual FAQ / snippets**, structured facts. **Suggested packaging:** one **small free** allowance (e.g. single short source / low word cap) + **Knowledge pack** Stripe add-on for real volume — full outline in **`docs/PRODUCT-ROADMAP.md` §4**. Engineering: storage, PDF parse, chunk+embed (same pattern as crawl RAG), dashboard + entitlements. |

### Priority band C — strong value, plan architecture early

| Area | What it means (expanded) |
|------|---------------------------|
| **Human handoff** | Visitor hits a limit (“talk to a human,” frustration, or explicit **Escalate** button). Flow: collect **email + optional message** → **notify owner** (email, Slack webhook, or form URL) → optional **ticket id** shown to visitor. Later: Zendesk/Intercom **API** to open a ticket with transcript. Start with **email/Slack + transcript link**; avoid boiling the ocean on day one. |
| **Visitor identity** | **Optional** prompt in widget: “Leave your email for a follow-up” (not required to chat). **Session cookie** to stitch “same browser, multiple messages” into one thread. **CRM export** = CSV of leads with last question snippet. **Privacy:** consent copy, opt-out, retention — align with `docs/legal/PRIVACY-POLICY.md` and regional rules. |

### Coming soon (market clearly; build when ready)

| Area | Positioning |
|------|-------------|
| **Prompt A/B** | Versioned **system prompts**, random or sticky **buckets**, log **outcomes** (thumb, handoff, session length). **Roadmap / “Coming soon”** on pricing or FAQ until shipped. |
| **Multi-channel** | **WhatsApp / SMS** = separate provider accounts (Twilio, Meta), **templates**, compliance (opt-in). Same **chat core**; new **ingress/egress adapters**. Treat as **phase 2+**; say **coming soon** publicly if you are not building it in Q1. |

**Ref:** `TODO.md` §7, `docs/PLATFORM-GAPS-ROADMAP.md`.

---

## 6. Post-launch stance (scope freeze)

- **Maintenance** (dependencies, Stripe/Clerk dashboard changes, provider incidents) is normal and not “scope creep.”
- **Scope freeze for marketing** = ship the **current** hands-off MVP, complete **§3**, then sell. That does **not** mean deprioritizing **Band A** (logs, messages UI, analytics): that is the **intended first expansion** after launch—or **in parallel** if you treat it as launch-blocking. **Defer** mainly **coming soon** items (prompt A/B, multi-channel) and heavy **Band B** until traction or explicit prioritization—unless you choose to build them earlier.
- **After launch, typical order:** (1) **§3** — ops, alerts, refund playbook; (2) **§5 band A** — persisted logs + owner messages UI + light analytics; **optional (2b)** **§2.5 pull-forward** — customer-chat **leads** + **slash commands** if sales-critical; (3) **§4** — **rich cards** (P2 RAG on crawl is already shipped); (4) **§5 band B** — **paid extra knowledge** + free tier limits (`docs/PRODUCT-ROADMAP.md` §4); (5) **§5 band C** — handoff + visitor identity (if not already done in 2b); (6) coming-soon items when ready.
- **Dashboard UX:** modernize the **owner dashboard** in parallel with band A (same surface: jobs, chat preview, **messages**). Use a **reference design** (Figma, screenshots, or a product you admire) so implementation matches a clear visual target — generic “make it hot” is ambiguous; references are not.

---

## 7. Reference docs

| Doc | Use |
|-----|-----|
| `TODO.md` | Engineering backlog; §6–9 = forward / parking |
| `docs/PRODUCT-ROADMAP.md` | **In place / next / want-haves** + Band B knowledge monetization outline |
| `docs/SECURITY-AND-API-AUDIT.md` | Auth matrix, rate limits, rolling action items |
| `docs/USER-GUIDE.md` | Share with customers |
| `docs/legal/TERMS-OF-SERVICE.md`, `PRIVACY-POLICY.md` | Legal drafts (review before relying) |
| `DEPLOYMENT.md` | Vercel, cron, `ADMIN_PATH_TOKEN` |
| `AUDIT.md` | Historical technical audit (verify critical items remain fixed) |
| §2.5 (this doc) | Founder vision gaps vs demo-only leads; default vs pull-forward shipping order |

---

## 8. Deprecated section (old checklist)

Earlier versions of this file listed Clerk, Stripe, and chat as **TODO**. That is **obsolete**; trust **§2** and `TODO.md` for shipped status. This file replaces that narrative.
