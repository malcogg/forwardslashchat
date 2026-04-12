# ForwardSlash.Chat - Backend Setup

Database and API setup guide. **Never commit database credentials** to the repo.

## Database (Neon Postgres + Drizzle)

### 1. Environment variables

Create `.env.local` in the project root with:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Get your connection string from [Neon Console](https://console.neon.tech). Use the **pooled** URL for serverless (Vercel).

**Vercel:** Add `DATABASE_URL` (or `POSTGRES_URL`) in Project → Settings → Environment Variables.

### Clerk (auth)

Required for `/dashboard` and sign-in to work. Add to Vercel:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys)
- `CLERK_SECRET_KEY`

Without these, the build uses a placeholder and auth will not work until you add the real keys and redeploy.

### 2. Push schema to database

After installing deps (`npm install`), run:

```bash
npm run db:push
```

This creates/updates tables from `db/schema.ts`.

### 3. Schema overview

- **users** – Auth (Clerk/NextAuth will sync)
- **scans** – Scan results (url, pageCount, categories)
- **orders** – Payments (amount, bundle, status)
- **customers** – Per-order chatbot config (businessName, domain, subdomain)
- **content** – Crawled pages per customer (for chat retrieval)

### 4. Drizzle commands

- `npm run db:push` – Sync schema to DB (dev)
- `npm run db:generate` – Generate migration files
- `npm run db:migrate` – Run migrations
- `npm run db:studio` – Open Drizzle Studio (requires `DATABASE_URL`)

### Admin

Add `ADMIN_EMAILS=your@email.com` (comma-separated) for `/api/admin/*`, and `ADMIN_PATH_TOKEN` (long random string) for the secret UI at `/fs-ops/{token}` — see `DEPLOYMENT.md`.

### Payments

See `docs/PAYMENT-SETUP.md`. Stripe: add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scan` | POST | Scan URL via Firecrawl, save to DB, return pageCount + scanId |
| `/api/orders` | POST | Create order + customer |
| `/api/orders/me` | GET | Current user's orders (for sidebar) |
| `/api/orders/[id]` | GET | Get order by ID |
| `/api/checkout/stripe` | POST | Create order + Stripe session, return checkout URL |
| `/api/webhooks/stripe` | POST | Stripe webhook — marks order paid |
| `/api/customers/[id]` | PATCH | Update customer status |
| `/api/customers/[id]/crawl` | POST | Crawl customer site, save content |
| `/api/dashboard?orderId=` | GET | Order + customer + contentCount |
| `/api/admin/orders` | GET | All orders (admin only) |

## Flow

1. **Scan** – URL → Firecrawl (50 pages) → saves to `scans` + sidebar (localStorage)
2. **Checkout** – Form → "Create order (test)" or "Pay with Stripe" → order + customer in DB
3. **Dashboard** – Sign in → order linked → "Build my chatbot" → crawl → content in DB
4. **Preview** – iPhone mockup shows chat using customer content + LLM
