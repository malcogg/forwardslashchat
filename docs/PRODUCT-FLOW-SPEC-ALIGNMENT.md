# Product Flow Spec Alignment

This doc captures how forwardslash.chat aligns with the high-level product flow spec (signup-first, crawl-after-signup, payment-after-scrape).

## Implemented Changes

### 1. **No full scraping until after signup** ✅
- **Before**: Landing page "Scan" triggered full Firecrawl crawl immediately (burned credits for anonymous users).
- **After**: Scan modal shows signup prompt only. No `/api/scan` call for unauthenticated flow.
- **Location**: `components/ScanModal.tsx`

### 2. **Signup-first flow** ✅
- Modal copy: "This scan may take a while depending on site size. You'll see the full status and AI chatbot after signing up. Create a free account to continue and get your results."
- **SignedOut**: "Create free account" → saves URL to sessionStorage, navigates to `/sign-up`
- **SignedIn**: "Continue to dashboard" → saves URL, navigates to `/dashboard`
- Clerk `afterSignUpUrl="/dashboard"` so new users land on dashboard after signup.

### 3. **Crawl only after payment** ✅
- User can sign up and skip to dashboard (see it without paying).
- On dashboard load with pending URL: creates order + customer (no crawl).
- When user clicks "Pay to scan" / "Build my chatbot": if unpaid → redirect to checkout.
- Crawl API returns 402 if order not paid (admins bypass).
- **No Firecrawl credits spent until payment.**

### 4. **Payment gate before crawl** ✅
- "Pay to scan" button when unpaid → checkout flow.
- After payment, "Build my chatbot" runs the actual crawl.

## Remaining Gaps / Not Yet Implemented

| Spec item | Status | Notes |
|----------|--------|------|
| Async job queue (BullMQ, Vercel Queue) | ❌ | Crawl runs synchronously (polls Firecrawl in request). 5–30 min crawls may timeout. |
| Firecrawl webhook/polling for long crawls | ❌ | Current: 3-min sync poll. Large sites may time out. |
| Terms/consent during signup | ❌ | "We scrape public data only; you confirm the site is yours." |
| Rate limiting & credit monitoring | ⚠️ | Credits exist; no alerts when nearing limits. |
| Large site warning | ❌ | "Sites >500 pages may require extra time/credits" |
| Order update on payment | Manual | Checkout goes to PayPal; order status updated manually (or via future webhook). |
| DNS upsell redirect | ⚠️ | Checkout has DNS add-on; no post-payment redirect to DNS setup page. |

## Current End-to-End Flow

1. User enters URL on landing page → clicks "Scan your site"
2. Modal opens → shows signup prompt (no crawl)
3. Clicks "Create free account" → URL saved to sessionStorage → redirect to sign-up
4. User signs up → Clerk redirects to `/dashboard`
5. Dashboard reads pending URL → creates order + customer via `/api/scan-request` (no crawl)
6. User sees dashboard with project, 0 pages crawled
7. Clicks "Pay to scan" → redirects to checkout
8. User pays via PayPal (manual order status update today)
9. Returns to dashboard → clicks "Build my chatbot" → crawl runs (Firecrawl credits used)
10. Admin/dev marks order paid, continues fulfillment

## Key Files

- `components/ScanModal.tsx` – signup gate, no pre-signup crawl
- `app/api/scan-request/route.ts` – create pending order + customer
- `app/dashboard/page.tsx` – pending URL handling, auto-crawl, payment CTA
- `app/api/scan/route.ts` – still exists; used only for cached/existing scans (not called from landing flow)
