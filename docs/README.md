# ForwardSlash.Chat — Documentation Index

**Last updated:** April 2026

This folder is the single place for product, technical, and operational docs. Use this index to find the right doc.

---

## Start here

| Audience | Doc |
|----------|-----|
| **New engineer (day one)** | [DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md) — env, first run, code map |
| **Day-to-day development** | [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) — workflows, demo behavior, DB, release hints |
| **Acquisition / due diligence** | [ACQUISITION-HANDBOOK.md](./ACQUISITION-HANDBOOK.md) — product summary, checklist, risks, doc map |
| **System design & flows** | [ARCHITECTURE-AND-FLOWS.md](./ARCHITECTURE-AND-FLOWS.md) — Mermaid diagrams, funnel flows |
| **Upgrades & dependencies** | [MAINTENANCE-AND-DEPENDENCIES.md](./MAINTENANCE-AND-DEPENDENCIES.md) |

| Doc | Purpose |
|-----|---------|
| [APP-OVERVIEW.md](./APP-OVERVIEW.md) | Product summary, stack (see **PRODUCTION-READINESS** + **TODO** for live roadmap) |
| [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md) | End-to-end flow, triggers, notifications, audit checklist |

---

## Technical reference

| Doc | Purpose |
|-----|---------|
| [TECH-SPEC.md](./TECH-SPEC.md) | Stack, project structure, schema, API reference (**source of truth** for routes) |
| [BACKEND-SETUP.md](./BACKEND-SETUP.md) | Database, env vars, API routes, flow |
| [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md) | How to run and add migrations |
| [CHAT-CONTEXT.md](./CHAT-CONTEXT.md) | How customer chat context is built (RAG + stuffing fallback, limits) |
| [CUSTOMER-CHAT-VISITOR-FEATURES.md](./CUSTOMER-CHAT-VISITOR-FEATURES.md) | Slash commands + visitor leads on `/chat/c/[customerId]` |
| [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) | Security review and endpoint auth |

---

## Product & pricing

| Doc | Purpose |
|-----|---------|
| [PLATFORM-GAPS-ROADMAP.md](./PLATFORM-GAPS-ROADMAP.md) | Gaps vs “full” chatbot SaaS; **bands A/B/C** (same story as `PRODUCTION-READINESS-CHECKLIST.md` §5) |
| [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) | **State / next / want-haves**; extra knowledge (PDF, FAQs) + **free vs paid** Band B outline |
| [pricing-and-bundles.md](./pricing-and-bundles.md) | **Single source of truth** for pricing tiers, add-ons, renewal |
| [MVP-PRD.md](./MVP-PRD.md) | MVP goals, scope, requirements |
| [INVESTOR-PITCH.md](./INVESTOR-PITCH.md) | Investor-facing overview |

---

## Flows & automation

| Doc | Purpose |
|-----|---------|
| [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md) | Full user flow, cron/webhook triggers, notifications |
| [APP-STATE-AND-AUTOMATION-PLAN.md](./APP-STATE-AND-AUTOMATION-PLAN.md) | Automated vs manual, DNS, go-live |
| [EMAIL-TRIGGERS-AND-DRAFTS.md](./EMAIL-TRIGGERS-AND-DRAFTS.md) | When each email fires and draft copy |
| [POST-PAYMENT-AUTOMATION.md](./POST-PAYMENT-AUTOMATION.md) | Post-payment cron and behavior |

---

## Operations & fulfillment

| Doc | Purpose |
|-----|---------|
| [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) | Launch scope, hands-off ops, P2 RAG / parity / rich UI priorities |
| [USER-GUIDE.md](./USER-GUIDE.md) | Short customer-facing how-to (shareable) |
| [legal/TERMS-OF-SERVICE.md](./legal/TERMS-OF-SERVICE.md) | Terms draft (`/terms`); **have counsel review** |
| [legal/PRIVACY-POLICY.md](./legal/PRIVACY-POLICY.md) | Privacy draft (`/privacy`); **have counsel review** |
| [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) | Manual fulfillment: crawl → config → deploy |
| [dev-instructions.md](./dev-instructions.md) | Checklist when a new order arrives |
| [INTERNAL-WORKFLOW.md](./INTERNAL-WORKFLOW.md) | Internal workflow and tools |
| [FIRST-ORDER-READINESS.md](./FIRST-ORDER-READINESS.md) | Pre-launch and first-order checklist |

---

## Setup & integrations

| Doc | Purpose |
|-----|---------|
| [PAYMENT-SETUP.md](./PAYMENT-SETUP.md) | Stripe setup |
| [RESEND-RECEIVING-SETUP.md](./RESEND-RECEIVING-SETUP.md) | Inbound email |
| [CLERK-WEBHOOK-TROUBLESHOOTING.md](./CLERK-WEBHOOK-TROUBLESHOOTING.md) | Clerk webhook issues |
| [API-SETUP-INSTRUCTIONS.md](./API-SETUP-INSTRUCTIONS.md) | API keys and external services |
| [FIRECRAWL-CREDITS.md](./FIRECRAWL-CREDITS.md) | Firecrawl credits and usage |
| [VERCEL-DOMAIN-AUTOMATION-SETUP.md](./VERCEL-DOMAIN-AUTOMATION-SETUP.md) | Vercel token + project for domain attach |

---

## Design & UX

| Doc | Purpose |
|-----|---------|
| [HOW-IT-WORKS-AND-USER-FLOW.md](./HOW-IT-WORKS-AND-USER-FLOW.md) | Intended customer flow and messaging |
| [landing-page-plan.md](./landing-page-plan.md) | Scan → pricing → checkout |
| [AI-CHATBOT-DESIGN-SYSTEM.md](./AI-CHATBOT-DESIGN-SYSTEM.md) | Chat UI and design |
| [dns-instructions-reference.md](./dns-instructions-reference.md) | CNAME copy-paste for customers |
| [demo-chat-page-instructions.md](./demo-chat-page-instructions.md) | Original demo page brief |
| [demo-chat-qa.md](./demo-chat-qa.md) | Demo keyword Q&A reference |

**Root:** [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) — landing/design tokens (if used).

---

## Build & scope (Cursor / AI)

| Doc | Purpose |
|-----|---------|
| [00-full-scope-prompt-for-cursor.md](./00-full-scope-prompt-for-cursor.md) | High-level build brief |
| [PRODUCT-FLOW-SPEC-ALIGNMENT.md](./PRODUCT-FLOW-SPEC-ALIGNMENT.md) | Spec vs implementation |

---

## Changelog & meta

| Doc | Purpose |
|-----|---------|
| [PROJECT-UPDATES.md](./PROJECT-UPDATES.md) | Log of doc/product updates |
| [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) | May be partially outdated — verify against code |

**Repo root:** [README.md](../README.md), [DEPLOYMENT.md](../DEPLOYMENT.md), [TODO.md](../TODO.md), [ROADMAP.md](../ROADMAP.md), [AUDIT.md](../AUDIT.md)

---

## SQL migrations (`docs/migrations/`)

Run in order in Neon (or your Postgres) when applying hand-written SQL. See [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md). Drizzle `db:push` covers most schema from `db/schema.ts`; numbered files document production-altered tables.

| File | Topic |
|------|--------|
| `001-credits.sql` | Credit usage |
| `003-checkout-leads.sql` | Checkout leads |
| `004`–`008` | Customers, orders, reminders, notifications |
| `009`–`014` | Plans, credits, jobs, Stripe columns, crawl progress |
| `015-user-onboarding.sql` | User onboarding questionnaire |
| `016-demo-chat-leads.sql` | **`demo_chat_leads`** for `/chat/demo` lead capture |
| `017-customer-chat-leads.sql` | **`customer_chat_leads`** for paid **`CustomerChat`** widget |

---

## What documentation to add next

High-value gaps (also listed in [ACQUISITION-HANDBOOK.md](./ACQUISITION-HANDBOOK.md)):

| Suggested doc | Why |
|---------------|-----|
| **Runbook: mark order paid manually** | Stripe webhook failure |
| **Clerk production setup** | Redirect URLs, env separation |
| **Incident response** | Severity, on-call, comms |
| **Data retention / deletion policy** | Compliance |
| **E2E smoke test list** | Regression safety |

Historical gap notes: [DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md) §5.
