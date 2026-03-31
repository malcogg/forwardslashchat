# ForwardSlash.Chat – Documentation Index

**Last updated:** February 2026

This folder is the single place for product, technical, and operational docs. Use this index to find the right doc.

---

## Start here (new developer)

| Doc | Purpose |
|-----|---------|
| [DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md) | **Read first.** Env, first run, key code locations, and what you need to take over the app. |
| [APP-OVERVIEW.md](./APP-OVERVIEW.md) | Product summary, stack, services, roadmap, and links to other docs. |
| [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md) | End-to-end flow, triggers, notifications, and audit checklist. |

---

## Product & pricing

| Doc | Purpose |
|-----|---------|
| [pricing-and-bundles.md](./pricing-and-bundles.md) | **Single source of truth** for pricing tiers, add-ons, renewal, and messaging. |
| [APP-OVERVIEW.md](./APP-OVERVIEW.md) | High-level product, stack, and roadmap. |
| [MVP-PRD.md](./MVP-PRD.md) | MVP goals, scope, and requirements. |
| [INVESTOR-PITCH.md](./INVESTOR-PITCH.md) | Investor-facing overview. |

---

## Technical reference

| Doc | Purpose |
|-----|---------|
| [TECH-SPEC.md](./TECH-SPEC.md) | Stack, project structure, schema, API reference. |
| [BACKEND-SETUP.md](./BACKEND-SETUP.md) | Database, env vars, API routes, flow. |
| [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md) | How to run and add migrations. |
| [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) | Security review and endpoint auth. |

---

## Flows & automation

| Doc | Purpose |
|-----|---------|
| [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md) | Full user flow, cron/webhook triggers, notifications, post-payment checklist. |
| [APP-STATE-AND-AUTOMATION-PLAN.md](./APP-STATE-AND-AUTOMATION-PLAN.md) | What’s automated vs manual, DNS, go-live, roadmap. |
| [EMAIL-TRIGGERS-AND-DRAFTS.md](./EMAIL-TRIGGERS-AND-DRAFTS.md) | When each email fires and draft copy. |
| [POST-PAYMENT-AUTOMATION.md](./POST-PAYMENT-AUTOMATION.md) | Post-payment cron and behavior. |

---

## Operations & fulfillment

| Doc | Purpose |
|-----|---------|
| [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) | Manual fulfillment: crawl → config → deploy. |
| [dev-instructions.md](./dev-instructions.md) | What to do when you get a new order (checklist). |
| [INTERNAL-WORKFLOW.md](./INTERNAL-WORKFLOW.md) | Internal fulfillment workflow and tools. |
| [FIRST-ORDER-READINESS.md](./FIRST-ORDER-READINESS.md) | Pre-launch and first-order checklist. |

---

## Setup & integrations

| Doc | Purpose |
|-----|---------|
| [BACKEND-SETUP.md](./BACKEND-SETUP.md) | DB, Clerk, env, API overview. |
| [PAYMENT-SETUP.md](./PAYMENT-SETUP.md) | Stripe (and PayPal) setup. |
| [RESEND-RECEIVING-SETUP.md](./RESEND-RECEIVING-SETUP.md) | Receive email at hello@forwardslash.chat. |
| [CLERK-WEBHOOK-TROUBLESHOOTING.md](./CLERK-WEBHOOK-TROUBLESHOOTING.md) | Clerk webhook issues. |
| [API-SETUP-INSTRUCTIONS.md](./API-SETUP-INSTRUCTIONS.md) | API keys and external services. |
| [FIRECRAWL-CREDITS.md](./FIRECRAWL-CREDITS.md) | Firecrawl credits and usage. |

---

## Design & UX

| Doc | Purpose |
|-----|---------|
| [HOW-IT-WORKS-AND-USER-FLOW.md](./HOW-IT-WORKS-AND-USER-FLOW.md) | Intended customer flow and messaging. |
| [LANDING-PAGE-ONE-FRAME-MODAL-FLOW.md](./LANDING-PAGE-ONE-FRAME-MODAL-FLOW.md) | Modal-first landing flow. |
| [landing-page-plan.md](./landing-page-plan.md) | Scan → pricing → checkout plan. |
| [AI-CHATBOT-DESIGN-SYSTEM.md](./AI-CHATBOT-DESIGN-SYSTEM.md) | Chat UI and design. |
| [dns-instructions-reference.md](./dns-instructions-reference.md) | CNAME copy-paste blocks for customers. |

---

## Build & scope (Cursor / AI)

| Doc | Purpose |
|-----|---------|
| [00-full-scope-prompt-for-cursor.md](./00-full-scope-prompt-for-cursor.md) | High-level build brief and scope for Cursor. |
| [PRODUCT-FLOW-SPEC-ALIGNMENT.md](./PRODUCT-FLOW-SPEC-ALIGNMENT.md) | Spec vs implementation alignment. |

---

## Other

| Doc | Purpose |
|-----|---------|
| [PROJECT-UPDATES.md](./PROJECT-UPDATES.md) | Changelog of doc and product updates. |
| [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) | DONE vs TODO (may be outdated). |
| [customer-dashboard-mvp.md](./customer-dashboard-mvp.md) | Dashboard MVP definition. |
| [demo-chat-page-instructions.md](./demo-chat-page-instructions.md) | Demo chat page. |
| [demo-chat-qa.md](./demo-chat-qa.md) | Demo Q&A. |
| [dns-setup-guide.md](../dns-setup-guide.md) | DNS setup (root). |
| [implementation-guide.md](../implementation-guide.md) | Implementation notes (root). |
| [quick-reference.md](../quick-reference.md) | Quick reference (root). |

---

## Migrations (SQL)

Migrations live in `docs/migrations/`. Run them in order in the Neon SQL Editor when needed. See [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md).

- `001-credits.sql` – Credit usage table  
- `005-block-fake-email-users.sql` – Block fake emails  
- `006-checkout-visits.sql` – Checkout abandonment tracking  
- `007-reminder-sent.sql` – Payment reminder sequence  
- `008-paid-notification-sent.sql` – Paid notification + build reminder  
