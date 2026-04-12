# Product roadmap — state, next, and want-haves

**Purpose:** One place for **what is live in the product**, **what we still need to build** (in rough priority order), and **want-haves** (valuable but explicitly later or optional). This complements `TODO.md` (engineering checklist) and `docs/PRODUCTION-READINESS-CHECKLIST.md` (launch vs parity).

**Last updated:** April 2026

---

## 1. In place today (shipped)

| Area | What exists |
|------|-------------|
| **Funnel** | Landing, pre-checkout scan, Stripe Checkout, Clerk auth, thank-you / dashboard entry |
| **Chatbot delivery** | Paid SKUs → webhook → auto-crawl (Firecrawl) → `content` rows → post-crawl + DNS emails → go-live job (CNAME, Vercel) |
| **Hosted chat** | `/chat/c/[customerId]`, streaming `POST /api/chat`, rate limits, branding from customer metadata |
| **Context & retrieval** | **Website crawl** is the default knowledge source. **P2 RAG** is implemented: chunking, OpenAI embeddings, **pgvector** table `content_chunks` (migration `019-content-chunks-rag.sql`), **top-k retrieval** per message with **character-cap stuffing fallback** if RAG is off, empty, or errors (`docs/CHAT-CONTEXT.md`, `lib/rag-*.ts`) |
| **Visitor UX (founder track)** | Slash shortcuts (server-expanded), optional lead gate → `customer_chat_leads`, dashboard summary (`docs/CUSTOMER-CHAT-VISITOR-FEATURES.md`) |
| **Rich metadata (not full RAG source)** | `customer_products`, `customer_blog_posts` + `POST /api/chat/extract-blocks` for UI cards alongside answers |
| **Credits / rescans** | Firecrawl credit model, manual crawl API, rescan credits where wired |
| **Ops** | Cron job worker, stuck-job recovery, admin path `/fs-ops/…`, structured logging |

**Explicit gap:** There is **no** owner-facing upload for PDFs, pasted “extra FAQs,” or arbitrary files yet. Crawl + optional products/blog tables cover what ships today.

---

## 2. What we need to get done (near-term, prioritized)

Rough order aligns with `PRODUCTION-READINESS-CHECKLIST.md` §3–§6 and `TODO.md` §7–§8. Adjust if launch strategy changes.

| Priority | Item | Why |
|----------|------|-----|
| **P0** | **Launch hygiene** (§3) | Legal review, live Stripe smoke, cron secrets, Resend domain, one E2E custom domain chat |
| **P0** | **Secrets & support playbooks** | Rotation, refund/chargeback handling, optional paging/Slack for job failures |
| **Band A** | **Persisted chat logs** | Threads/messages per tenant, retention, export/delete, policy hooks |
| **Band A** | **Owner “Messages” UI** | Inbox-style view on top of logs (not admin-only) |
| **Band A** | **Analytics v1** | Volume, sessions, optional thumbs; simple aggregates |
| **Product depth** | **Rich chat UI cards** | Differentiated visitor experience (`docs/CHATBOT-RICH-UI-AND-CARDS-PLAN.md`) |
| **Band B** | **Extra knowledge + monetization** | See **§4** — this is the PDF / “train it more” track |

**Dependency note:** Extra knowledge (PDFs, uploads, manual text) **reuses the same mental model as crawl RAG**: ingest → chunk → embed → store in vector index (same or parallel table with `source_type`). Pricing and limits are product/Stripe work on top of ingestion.

---

## 3. Want-haves (later / market as “coming soon”)

| Item | Notes |
|------|--------|
| **Human handoff** | Escalation → notify owner (email/Slack) + transcript; CRM APIs later (**Band C**) |
| **Visitor identity** | Optional email in widget, session stitching, CRM export, consent copy (**Band C**) |
| **Prompt A/B or versioning** | Buckets, outcome logging |
| **Multi-channel** | WhatsApp/SMS; same core, new adapters |
| **Owner-defined slash commands** | Dashboard-configured shortcuts (today: fixed server list) |
| **CSV export** | e.g. `customer_chat_leads` from UI (data already in DB) |
| **Landing experiments** | A/B copy and positioning tests |

---

## 4. Extra knowledge (“train it more”) — product shape & pricing

**User goal:** Add **context the crawler did not see**: PDFs, policies, internal FAQs, pricing addenda, etc. **Business goal:** **Charge** for material beyond a small free allowance.

### 4.1 Free tier (included, strict limits)

Intent: let every owner **taste** the feature without turning the base SKU into unlimited storage/embedding cost.

| Dimension | Example direction (tune before launch) |
|-----------|----------------------------------------|
| **Sources** | **1** “custom knowledge source” (e.g. one FAQ doc **or** one small PDF **or** one long pasted text block) |
| **Size** | Low cap on **total characters** or **pages** (e.g. on the order of a few thousand to ~10k words — not a full handbook) |
| **File types** | Start with **plain text / markdown paste** first; PDF second (parsing cost + failures) |
| **Refresh** | Optional: re-embed only on edit, not on every chat |

Everything above the free envelope requires a **paid add-on** (or higher plan).

### 4.2 Paid / upcharge (Knowledge pack)

| Dimension | Example direction |
|-----------|-------------------|
| **Pack** | Stripe **one-time or subscription** add-on: “Knowledge pack” with **N sources**, **M MB** total, **higher monthly embed budget** |
| **Tiers** | e.g. **Standard** (few PDFs / docs) vs **Pro** (more volume, priority re-index) |
| **Overage** | Metered embeddings or hard cap with upsell message in dashboard |

**Pricing implementation:** New Stripe Price IDs, webhook handling to flip flags / quotas on `customers` (or a `customer_knowledge_entitlements` table), dashboard UI to show usage vs limit.

### 4.3 Engineering work (not built yet)

1. **Schema** — e.g. `knowledge_sources` (customer_id, type: `paste` \| `pdf`, storage URL or inline text, title, created_at, bytes, status) + link chunks to `source_id` (or parallel `knowledge_chunks` table).
2. **Storage** — object storage for PDFs (S3, R2, Vercel Blob) with signed upload from dashboard.
3. **Ingestion** — PDF text extraction (server-side library or vendor); sanitize; same chunking + embedding pipeline as crawl (`lib/rag-index.ts` pattern).
4. **Retrieval** — merge crawl chunks + knowledge chunks in `POST /api/chat` (single top-k across union, or weighted: e.g. boost manual FAQ).
5. **Dashboard** — list sources, upload UI, delete, “re-index,” usage meter.
6. **Safety** — virus scan / file type allowlist, max upload size, per-customer rate limits.

### 4.4 Relationship to crawl-only RAG

| Layer | Role |
|-------|------|
| **Crawl** | Primary site truth; refreshed on rescans |
| **Extra knowledge** | Supplemental, owner-controlled; ideal for PDFs and facts not on the public site |
| **Retrieval** | One embedding space per customer (simplest) or separate indexes merged at query time |

---

## 5. How this doc maps elsewhere

| Doc | Role |
|-----|------|
| `TODO.md` §6–§9 | Engineering tasks and checkboxes |
| `docs/PRODUCTION-READINESS-CHECKLIST.md` | Launch vs post-launch bands |
| `docs/PLATFORM-GAPS-ROADMAP.md` | Short gap list vs “full” chatbot SaaS |
| `docs/CHAT-CONTEXT.md` | Runtime behavior of customer chat context |
| `docs/pricing-and-bundles.md` | When you add SKUs, update this as **source of truth** for customer-facing pricing |

---

## 6. Summary table

| Category | Examples |
|----------|----------|
| **In place** | Crawl → chat, pgvector RAG + fallback, slash + leads, go-live automation, credits/rescans |
| **Need to do** | Launch hygiene, Band A (logs, messages, analytics), rich cards, **Band B extra knowledge + Stripe entitlements** |
| **Want-haves** | Handoff, visitor identity, prompt A/B, multi-channel, owner slash config, exports |
