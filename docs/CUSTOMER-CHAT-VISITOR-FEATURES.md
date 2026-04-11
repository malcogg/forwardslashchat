# Customer chat — visitor features (slash commands & leads)

**Last updated:** April 2026  

This document describes **production** behavior for `/chat/c/[customerId]` (and custom-host rewrites to the same page): **slash-style shortcuts** and **optional visitor lead capture**. Demo-only behavior remains in [demo-chat-page-instructions.md](./demo-chat-page-instructions.md) and `POST /api/chat/demo/lead`.

---

## 1. Slash commands

### Behavior

- Visitors can type **`/about`**, **`/pricing`**, **`/blog`**, **`/contact`**, **`/products`**, **`/help`** (case-insensitive command token).
- The **UI still shows** what the visitor typed (e.g. `/pricing`).
- **`POST /api/chat`** expands** the **last user message** only: if it starts with `/` and matches a known command, the text sent to the LLM is replaced with a **fixed instruction** that asks for that topic using **only** crawled site content. Extra text after the command is appended (capped).
- **Unknown** `/commands` are **not** expanded; the raw string is passed to the model like a normal message.

### Source of truth

| Piece | Location |
|--------|----------|
| Command → prompt map | `lib/chat-slash-commands.ts` (`expandSlashCommand`, `SLASH_COMMAND_CHIPS`) |
| Expansion applied | `app/api/chat/route.ts` (after `sanitizeChatMessage`, before `streamText`) |
| Quick-reply chips | `components/CustomerChat.tsx` (sends `/${command}`) |

### Security / abuse

- Same **per-`customerId` rate limit** as normal chat (`CHAT_RATE_LIMIT_PER_MINUTE`).
- Expansion is **server-side** so clients cannot skip it.

---

## 2. Visitor lead capture (paid customer chat)

### UX

- On first visit (per browser tab **session**), **`CustomerChat`** shows **`CustomerChatLeadGate`**: name → email → optional phone, all **skippable** (`skip` or empty phone step).
- After complete or skip, **`sessionStorage`** key **`fs_cust_lead_v1_{customerId}`** is set to `1` or `skipped` so the gate does not repeat until the session ends.
- **Dashboard preview** (`previewDemo`) **skips** the gate.

### API

| Method | Path | Body | Notes |
|--------|------|------|--------|
| POST | `/api/chat/customer-lead` | `{ customerId, skipped: true }` **or** `{ customerId, firstName, email, phone? }` | **Paid** customer only (`getPaidCustomerForChat`); **per-IP** rate limit `CUSTOMER_CHAT_LEAD_RATE_LIMIT_PER_MINUTE` (default **20**, clamped 5–40) |

### Database

- Table **`customer_chat_leads`** (`db/schema.ts`): `customer_id` FK → `customers.id` **ON DELETE CASCADE**, `first_name`, `email`, `phone`, `skipped`, `created_at`.
- Constraint: if `skipped = false`, `first_name` and `email` must be non-empty (mirrors `demo_chat_leads`).
- **Migration file:** `docs/migrations/017-customer-chat-leads.sql` — run in Neon (or use `npm run db:push` in dev when `DATABASE_URL` is set).

### Owner visibility

- **`GET /api/dashboard`** includes **`visitorLeads`**: `total90d` (non-skipped, last 90 days) and **`recent`** (up to 20 rows) for the current order’s customer.
- Dashboard UI: **“Visitor chat leads”** card (chatbot orders only, not website-builder SKUs).

---

## 3. Shared paid-customer guard

`lib/customer-chat-access.ts` — **`getPaidCustomerForChat(customerId)`** — used by:

- `POST /api/chat`
- `POST /api/chat/customer-lead`

Ensures the chatbot and lead endpoint are not used for unpaid or missing tenants.

---

## 4. Related docs

- [CHAT-CONTEXT.md](./CHAT-CONTEXT.md) — context stuffing / future RAG
- [SECURITY-AND-API-AUDIT.md](./SECURITY-AND-API-AUDIT.md) — public endpoints matrix
- [TECH-SPEC.md](./TECH-SPEC.md) — routes and schema summary
