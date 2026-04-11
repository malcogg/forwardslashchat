# Project Updates Log

## 2026-04-11

### Customer chat: slash commands + visitor leads (production)

- **`lib/chat-slash-commands.ts`** — `/about`, `/pricing`, `/blog`, `/contact`, `/products`, `/help` expanded server-side in **`POST /api/chat`**; UI chips in **`CustomerChat`**.
- **`lib/customer-chat-access.ts`** — shared **paid-customer** guard for chat + customer-lead API.
- **`customer_chat_leads`** table + **`docs/migrations/017-customer-chat-leads.sql`**; **`POST /api/chat/customer-lead`** with IP rate limit (`CUSTOMER_CHAT_LEAD_RATE_LIMIT_PER_MINUTE`).
- **`CustomerChatLeadGate`** — optional skippable name/email/phone before chat; **`GET /api/dashboard`** adds **`visitorLeads`** + dashboard **Visitor chat leads** card (chatbot orders).
- **Docs:** [CUSTOMER-CHAT-VISITOR-FEATURES.md](./CUSTOMER-CHAT-VISITOR-FEATURES.md); updates to TECH-SPEC, SECURITY audit, CHAT-CONTEXT, ARCHITECTURE, DEVELOPER-GUIDE, USER-GUIDE, PRODUCTION-READINESS §2.5, PLATFORM-GAPS, README migrations index, **TODO** §7 founder items marked shipped.
- **Removed** unused root **`pricing-mockup.html`**.

---

## 2026-04-10

### Founder vision gaps (explicit)

- **`docs/PRODUCTION-READINESS-CHECKLIST.md` §2.5** — table: slash commands + **customer-chat** leads vs demo-only today; default **ship order** (§3 → A → RAG/cards → B/C); **pull-forward** note + `TODO.md` §7 **Founder vision (parallel)** checkboxes.
- **`docs/PLATFORM-GAPS-ROADMAP.md`** — band **A² / parallel** row for founder vision.

### Strategy & doc alignment (owner experience = planned, not “maybe”)

- **`TODO.md` §7** — Replaced flat “parity” list with **bands A/B/C + coming soon**, matching `docs/PRODUCTION-READINESS-CHECKLIST.md` §5 (logs, messages UI, analytics v1; monetized knowledge; handoff + visitor identity; roadmap items).
- **`TODO.md` §8** — Added **owner dashboard modernization** (design-reference-driven); fixed security audit line for `/api/scan/roast` rate limit.
- **`TODO.md` §9** — Reframed **rich chat UI cards** as long-term differentiation (not “parking lot only”).
- **`docs/PLATFORM-GAPS-ROADMAP.md`** — Rewritten around the same bands; removed “nothing is a commitment” framing.
- **`docs/APP-OVERVIEW.md`** — Removed stale PayPal-primary / obsolete email table / old phases; points to PRODUCTION-READINESS + TODO for live roadmap.
- **`ROADMAP.md`** — Top note: historical phases vs current backlog in PRODUCTION-READINESS / TODO.
- **`docs/README.md`** — APP-OVERVIEW blurb + PLATFORM-GAPS index row.

---

## 2026-04-01

### Documentation (acquisition & engineering handoff)

- Added **[ACQUISITION-HANDBOOK.md](./ACQUISITION-HANDBOOK.md)** — due diligence checklist, doc map, subprocessors, risks.
- Added **[DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md)** — consolidated dev workflows, `/chat/demo` behavior, env summary.
- Added **[ARCHITECTURE-AND-FLOWS.md](./ARCHITECTURE-AND-FLOWS.md)** — Mermaid diagrams (system context, happy path, demo funnel, routing).
- Added **[MAINTENANCE-AND-DEPENDENCIES.md](./MAINTENANCE-AND-DEPENDENCIES.md)** — upgrade policy for Next, Clerk, Drizzle, Stripe, AI SDK, etc.
- Rewrote **[docs/README.md](./README.md)** — index with new sections, migration list through `016-demo-chat-leads.sql`.
- Updated **[TECH-SPEC.md](./TECH-SPEC.md)** — `demo_chat_leads`, `POST /api/chat/demo/lead`, demo chat UX (lead capture, hybrid LLM, `?forceLead=1`, new chat).
- Updated root **[README.md](../README.md)** and **[DEVELOPER-HANDOFF.md](./DEVELOPER-HANDOFF.md)** to point at the new docs.

### Product (already in codebase)

- Demo page: lead capture → hybrid keyword + LLM chat; `demo_chat_leads` table + API; `+` new chat control.

---

## 2026-02-10

### Added Documents

- `docs/INTERNAL-WORKFLOW.md`
  - Internal fulfillment SOP from payment to delivery.
  - Includes tools, step-by-step workflow, QA checklist, and timing estimates.
- `docs/MVP-PRD.md`
  - Full MVP PRD with goals, requirements, architecture, and risks.
  - Updated pricing model with multi-year bundles and optional renewals.
  - Recommended default: 2-year option for chosen tier (see pricing-and-bundles.md).

### Pricing Model Changes (PRD)

- Replaced lifetime hosting promise with:
  - Year 1 included hosting/maintenance.
  - Optional renewal after bundle period (see app/docs for current rate).
- Added bundle pricing (1-5 years) and DNS setup add-on ($100).

### Internal Workflow Updates

- Updated pricing references to new multi-year bundles.
- Added prepaid years tracking and `prepaidUntil` in config.
- Clarified hosting/maintenance terms and optional renewal pricing.
- Added renewal watch list and delivery email notes for prepaid period.

### Added Developer Instructions

- Added `docs/dev-instructions.md` with step-by-step actions for new orders,
  embeddings, DNS setup, delivery, and post-delivery tasks.

### Added User Flow Doc

- Added `docs/HOW-IT-WORKS-AND-USER-FLOW.md` describing the MVP customer flow,
  landing page messaging, and dashboard sections.

### Scope Alignment Updates

- Updated internal docs to match the new MVP scope (no embeddings in MVP).
- Switched payment references to PayPal primary with Stripe fallback.
- Added `docs/00-full-scope-prompt-for-cursor.md` as the official build brief.

### Demo Chat Instructions

- Added `docs/demo-chat-page-instructions.md` with guidance for the public
  demo chat page and API route.

### New Planning Docs

- Added `docs/pricing-and-bundles.md` as the single source of truth for pricing.
- Added `docs/customer-dashboard-mvp.md` defining the MVP dashboard.
- Added `docs/dns-instructions-reference.md` with CNAME copy-paste blocks.

### Landing Page Plan

- Added `docs/landing-page-plan.md` with the modal-first scan, pricing, and
  checkout flow.
- Updated with scan -> page count -> auto-pricing flow (tier pre-selected).
- Added page count to tier mapping table.

### One-Frame, Modal-Only Landing

- Added `docs/LANDING-PAGE-ONE-FRAME-MODAL-FLOW.md`: traditional style, no scroll,
  all actions in center modals with blur. Flow: welcome -> enter URL -> scan ->
  results + toggles -> pricing -> pay -> sign up -> dashboard.

### Scan -> Page Count -> Auto-Pricing

- Scan results now drive pricing modal: tier pre-selected by page count.
- Added to landing-page-plan, 00-full-scope-prompt-for-cursor, pricing-and-bundles.

### First Order Readiness

- Added `docs/FIRST-ORDER-READINESS.md` with pre-launch and first-order checklists.

### Developer Workflow (Manual Fulfillment)

- Added `docs/DEV-WORKFLOW-MANUAL-FULFILLMENT.md` with step-by-step instructions:
  Firecrawl → validate → config → build with Cursor → push (GitHub/v0) →
  deploy (Vercel) → DNS → QA.

## Notes for Next Updates

- Send any new requirements, copy, or changes.
- I will append changes here and keep this log current.
- Once this log is updated, we can proceed to the landing page.
