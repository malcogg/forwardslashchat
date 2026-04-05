# ForwardSlash.Chat — Acquisition & Engineering Handbook

**Purpose:** Give an acquiring company’s product, engineering, and security teams a single entry point for due diligence and handoff.  
**Last updated:** April 2026

---

## 1. What the product is

**ForwardSlash.Chat** is a B2B SaaS-style product that sells **custom AI chatbots** trained on a customer’s website content, deployed on the **customer’s own domain** (e.g. `chat.clientdomain.com`), with **one-time pricing** (no mandatory monthly platform fee for the core product).

**Rough flow:** marketing site → optional scan → checkout (Stripe) → crawl (Firecrawl) → content stored in Postgres → chat answers via OpenAI using that content → customer configures branding/DNS in dashboard → go-live on custom host.

---

## 2. Repository & runtime facts

| Item | Detail |
|------|--------|
| **Monorepo** | Single Next.js application (not a monorepo of many packages). |
| **Framework** | Next.js 15 App Router, React 19, TypeScript 5. |
| **Database** | PostgreSQL (Neon in production); ORM: Drizzle. |
| **Auth** | Clerk (dashboard, admin-adjacent flows). |
| **Payments** | Stripe Checkout + webhooks. |
| **AI** | Vercel AI SDK + OpenAI (`gpt-4o-mini` for chat paths). |
| **Crawl** | Firecrawl API. |
| **Email** | Resend. |
| **Hosting** | Vercel (typical); custom domains via Vercel Domains API where automated. |

**Source of truth for structure and APIs:** [TECH-SPEC.md](./TECH-SPEC.md).  
**Visual flows:** [ARCHITECTURE-AND-FLOWS.md](./ARCHITECTURE-AND-FLOWS.md).

---

## 3. Intellectual property & third parties

- **Application code** is in this repository under the owner’s license (confirm with legal).
- **Customer data** includes: site copy ingested into `content`, PII in `orders` / `checkout_leads` / `demo_chat_leads`, Clerk user records, Stripe payment metadata.
- **Third-party subprocessors** (verify current DPAs): OpenAI, Stripe, Clerk, Neon, Vercel, Firecrawl, Resend, and any DNS/hosting the business uses for email domains.

---

## 4. Due diligence checklist (technical)

Use this as a starting list; legal/compliance should extend it.

- [ ] **Secrets inventory:** All env vars in Vercel (and staging); rotation procedure; no secrets in git history (scan with `gitleaks` or similar).
- [ ] **Database:** Neon project ownership, backup/restore tested, migration history (`docs/migrations/` + Drizzle).
- [ ] **Stripe:** Webhook signing secret, live vs test keys, refund/chargeback process documented.
- [ ] **Clerk:** Production instance, allowed redirect URLs, session policies.
- [ ] **Domain/DNS automation:** `VERCEL_ACCESS_TOKEN`, project ID, documented in [VERCEL-DOMAIN-AUTOMATION-SETUP.md](./VERCEL-DOMAIN-AUTOMATION-SETUP.md).
- [ ] **Cron / jobs:** Vercel cron URLs and `CRON_SECRET`; what each job does ([APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md)).
- [ ] **Rate limits:** Chat and demo endpoints use IP-based limits; review `lib/rate-limit.ts` and env tunables.
- [ ] **Admin access:** `ADMIN_EMAILS`, `/admin`, any token-based ops routes (`/fs-ops/*`).

---

## 5. Risks & technical debt (non-exhaustive)

- **RAG:** Customer chat today is largely **context stuffing** from crawled pages, not vector RAG; see [CHAT-CONTEXT.md](./CHAT-CONTEXT.md). Scale and relevance limits are documented there.
- **Operational docs** vary in freshness; prioritize [TECH-SPEC.md](./TECH-SPEC.md), [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md), and this handbook for structure.
- **Pricing copy** may appear in multiple places (landing, demo hardcoded strings, `lib/pricing.ts`); align before major marketing changes.

---

## 6. Document map (where to read next)

| Audience | Start here |
|----------|------------|
| **Engineering lead** | [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md), [TECH-SPEC.md](./TECH-SPEC.md), [ARCHITECTURE-AND-FLOWS.md](./ARCHITECTURE-AND-FLOWS.md) |
| **DevOps / SRE** | [DEPLOYMENT.md](../DEPLOYMENT.md), [BACKEND-SETUP.md](./BACKEND-SETUP.md), [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md) |
| **Security** | [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) |
| **Product / PM** | [APP-OVERVIEW.md](./APP-OVERVIEW.md), [HOW-IT-WORKS-AND-USER-FLOW.md](./HOW-IT-WORKS-AND-USER-FLOW.md), [pricing-and-bundles.md](./pricing-and-bundles.md) |
| **Ongoing maintenance** | [MAINTENANCE-AND-DEPENDENCIES.md](./MAINTENANCE-AND-DEPENDENCIES.md) |

**Full index:** [docs/README.md](./README.md).

---

## 7. Recommended future documentation

Items worth adding over time (not all are blockers for an acquisition):

| Doc | Why |
|-----|-----|
| **Runbook: manual “mark order paid”** | When Stripe webhook fails in production. |
| **Clerk production setup** | Redirect URLs, production vs dev apps, org policy. |
| **Incident response** | On-call, severity, comms template. |
| **Data retention & deletion** | How long to keep `content`, chat logs, leads; GDPR/CCPA alignment. |
| **Load / performance baseline** | Expected RPS, cold starts, Neon limits. |
| **E2E test list** | Critical paths (checkout, webhook, crawl, chat). |

See also section 5 in [DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md) for earlier “gap” notes; some are partially covered by deployment and migration docs.
