# Architecture & Flow Design — ForwardSlash.Chat

**Last updated:** April 2026  
**Companion:** [TECH-SPEC.md](./TECH-SPEC.md) for file paths and API tables.

This document describes **behavioral** architecture and **user/system flows** at a level suitable for engineering handoff and product alignment.

---

## 1. System context (C4-style)

```mermaid
flowchart LR
  subgraph clients [Clients]
    Browser[Browser / visitor]
    CustomerSite[Customer visitors]
  end

  subgraph vercel [Vercel - Next.js]
    App[Next.js app]
    MW[middleware.ts]
  end

  subgraph data [Data & AI]
    Neon[(PostgreSQL / Neon)]
    OpenAI[OpenAI API]
    FC[Firecrawl API]
  end

  subgraph pay [Payments & auth]
    Stripe[Stripe]
    Clerk[Clerk]
  end

  Browser --> App
  CustomerSite --> MW
  MW --> App
  App --> Clerk
  App --> Stripe
  App --> Neon
  App --> OpenAI
  App --> FC
```

**Note:** Chat answers for **deployed** bots use text stored in Neon + OpenAI. The **marketing demo** at `/chat/demo` uses a **hybrid** of hardcoded keyword replies and an LLM fed from `data/demo-content.json` (no customer DB).

---

## 2. Primary business flow (happy path)

```mermaid
sequenceDiagram
  participant U as User
  participant Web as Next.js
  participant S as Stripe
  participant DB as Postgres
  participant FC as Firecrawl
  participant AI as OpenAI

  U->>Web: Landing / checkout
  Web->>S: Create Checkout Session
  S-->>U: Pay
  S->>Web: Webhook checkout.session.completed
  Web->>DB: orders.status = paid, customers...
  U->>Web: Dashboard — crawl
  Web->>FC: Crawl customer URL
  FC-->>Web: Pages / markdown
  Web->>DB: content rows
  U->>Web: Visitor opens chat.customer.com
  Web->>DB: Load content for customerId
  Web->>AI: streamText (stuffed context)
  AI-->>U: Streamed answer
```

**Automation gaps** (intentional or roadmap) are described in [APP-STATE-AND-AUTOMATION-PLAN.md](./APP-STATE-AND-AUTOMATION-PLAN.md) and [APP-FLOW-AND-AUDIT.md](./APP-FLOW-AND-AUDIT.md).

---

## 3. Request routing (marketing domain vs customer host)

| Host | Behavior |
|------|----------|
| `forwardslash.chat` (and configured main hosts) | Normal App Router: `/`, `/checkout`, `/dashboard`, `/chat/demo`, etc. |
| **Other hostnames** (e.g. `chat.client.com`) | `middleware.ts` calls `/api/chat/resolve-by-host`; if a `customerId` is found, **rewrite** to `/chat/c/[customerId]`. |

This lets each customer’s chat **live on their domain** without separate deployments per tenant.

---

## 4. Demo funnel flow (`/chat/demo`)

```mermaid
flowchart TD
  A[Visit /chat/demo] --> B{fs_demo_lead_v2 in sessionStorage?}
  B -->|No| C[Lead capture: name → email → phone]
  B -->|Yes| D[Main demo chat]
  C --> E[POST /api/chat/demo/lead]
  E --> D
  D --> F{User message}
  F -->|Keyword match| G[Hardcoded reply + pills]
  F -->|No match| H[POST /api/chat/demo LLM]
  G --> D
  H --> D
  D --> I[+ New chat clears thread only]
```

**Force replay intro:** `/chat/demo?forceLead=1` (clears session flag and shows lead steps again).

---

## 5. Customer chat context (production)

Not vector search today: **stuff** recent crawled pages into the system prompt up to a character budget. Implications and limits: [CHAT-CONTEXT.md](./CHAT-CONTEXT.md).

---

## 6. Key state machines (conceptual)

**Order / customer** (simplified; see `db/schema.ts` for exact enums):

- Customer `status`: pipeline from pending through crawling, DNS, testing, delivered.
- Order payment: `pending` → `paid` via Stripe webhook.

**Demo lead** (`demo_chat_leads`):

- Either `skipped = true` (funnel declined), or `skipped = false` with `first_name` + `email` (phone optional).

---

## 7. Where flows are implemented in code

| Flow | Primary files |
|------|----------------|
| Checkout | `app/checkout/`, `app/api/checkout/stripe/route.ts` |
| Webhook | `app/api/webhooks/stripe/route.ts` |
| Crawl | `app/api/customers/[id]/crawl/route.ts` |
| Customer chat | `app/api/chat/route.ts`, `components/CustomerChat.tsx` |
| Demo | `app/chat/demo/page.tsx`, `app/api/chat/demo/route.ts`, `app/api/chat/demo/lead/route.ts` |
| Go-live / DNS | `app/api/customers/[id]/go-live/route.ts`, docs under `docs/VERCEL-*.md` |

---

## 8. Diagram maintenance

When you change a **core** flow (checkout, webhook, crawl, chat), update this file and [TECH-SPEC.md](./TECH-SPEC.md). Mermaid renders in GitHub and most Markdown viewers.
