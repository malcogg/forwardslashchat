# ForwardSlash.Chat

ForwardSlash is a **one-time-payment AI chatbot builder** for a customer’s website. After checkout, we **crawl the customer’s site (Firecrawl)**, store the content in Postgres, and serve a **host-based chatbot** on the customer’s chosen domain (e.g. `chat.theirdomain.com`) using **OpenAI** for answers.

## What this repo contains

- **Web app**: Next.js App Router (Next 15 / React 19)
- **Auth**: Clerk (dashboard + customer management)
- **Payments**: Stripe Checkout + webhooks (one-time)
- **Crawl**: Firecrawl (markdown page extraction)
- **Chat**: AI SDK streaming response using stored site content
- **Email**: Resend (payment + crawl + DNS instructions)
- **DB**: Postgres (Neon recommended) + Drizzle ORM
- **Hosting**: Vercel + Domains API for automated custom-domain attach

## How it works (high-level)

1. **Checkout** (`/checkout` → `POST /api/checkout/stripe`)
   - Creates (or updates) an `orders` row and sends the user to Stripe Checkout.
2. **Stripe webhook** (`POST /api/webhooks/stripe`)
   - Verifies signature, dedupes events, and marks the order **paid**.
3. **Crawl / build** (`POST /api/customers/[id]/crawl`)
   - Calls Firecrawl to crawl the customer’s website and writes `content` rows (URL/title/body).
4. **Chat** (`/chat/c/[customerId]` + `POST /api/chat`)
   - Public chat endpoint is **gated to paid orders** and streams an OpenAI response using the stored content.
5. **Go live (custom domain)** (`POST /api/customers/[id]/go-live`)
   - Verifies the customer’s CNAME via DNS-over-HTTPS and attaches the domain to the Vercel project.
6. **Host-based routing**
   - `middleware.ts` rewrites `chat.theirdomain.com` → `/chat/c/[customerId]`.

## Dev setup (local)

### Prereqs

- Node.js **18+**
- Postgres DB (Neon recommended)

### 1) Install

```bash
npm install
```

### 2) Configure env

Create `.env.local` with at least:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY` (test key for local)
- `STRIPE_WEBHOOK_SECRET` (test webhook secret for local)
- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Optional (only needed for domain automation + cron/admin):

- `VERCEL_ACCESS_TOKEN`
- `VERCEL_PROJECT_ID`
- `CNAME_TARGET` (defaults to `cname.vercel-dns.com`)
- `NEXT_PUBLIC_CNAME_TARGET` (recommended: match `CNAME_TARGET` so the dashboard DNS instructions are correct)
- `CRON_SECRET`
- `ADMIN_EMAILS`

### 3) DB

```bash
npm run db:push
```

### 4) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Repo map (where to look)

- **Checkout + webhooks**
  - `app/api/checkout/stripe/route.ts`
  - `app/api/webhooks/stripe/route.ts`
- **Customer build + go-live**
  - `app/api/customers/[id]/crawl/route.ts`
  - `app/api/customers/[id]/go-live/route.ts`
- **Chat**
  - `app/api/chat/route.ts`
  - `app/chat/c/[customerId]/page.tsx`
- **Routing**
  - `middleware.ts`
- **DB schema**
  - `db/schema.ts`

## Docs

**Index (start here):** [`docs/README.md`](docs/README.md)

| Doc | Purpose |
|-----|---------|
| [`docs/ACQUISITION-HANDBOOK.md`](docs/ACQUISITION-HANDBOOK.md) | Handoff for acquirers: product, diligence checklist, risks |
| [`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md) | Day-to-day engineering: setup, code map, demo page behavior |
| [`docs/ARCHITECTURE-AND-FLOWS.md`](docs/ARCHITECTURE-AND-FLOWS.md) | Flow diagrams (Mermaid) and routing |
| [`docs/MAINTENANCE-AND-DEPENDENCIES.md`](docs/MAINTENANCE-AND-DEPENDENCIES.md) | Upgrading Next, React, Clerk, Stripe, etc. |
| [`docs/TECH-SPEC.md`](docs/TECH-SPEC.md) | Stack, APIs, schema summary |
| [`docs/DEVELOPER-HANDOFF.md`](docs/DEVELOPER-HANDOFF.md) | First-day env checklist |

Also: `AUDIT.md`, `ROADMAP.md`, `TODO.md`, `DEPLOYMENT.md`, `API_KEYS.md`, `docs/VERCEL-DOMAIN-AUTOMATION-SETUP.md`

## v0.dev deployment note

If you are deploying via v0.dev, it may be pinned to a single Git branch. Make sure the deployment SHA matches `GET /api/version`, and if v0 is stuck on an older commit, do a hard reset in the v0 terminal:

```bash
git fetch origin
git checkout trigger-code-change
git reset --hard origin/trigger-code-change
git clean -fd
```
