# ForwardSlash.Chat

AI chatbots for your website. One-time payment. Your domain.

## Setup

1. Install Node.js (v18+) if not already: https://nodejs.org
2. Install dependencies:

```bash
npm install
```

3. Run the dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Project Structure

- `app/page.tsx` - Landing page (one-frame, no scroll)
- `app/dashboard/page.tsx` - Customer dashboard
- `components/ScanModal.tsx` - Scan -> results + toggles -> pricing flow
- `app/api/scan/route.ts` - Scan API (mock for now; add Firecrawl)
- `docs/` - Planning docs and specs

## Next Steps

- Add Firecrawl API to `app/api/scan/route.ts`
- Wire real PayPal/Stripe checkout
- Add auth (Clerk or NextAuth)
- Add chat API and multi-tenant routing
