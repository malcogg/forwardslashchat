# Firecrawl Credit System

1 page scraped = 1 credit. Per-user caps based on plan.

## Per-User Allocation

Your Firecrawl account credits are shared across all users. Each user gets a **small allocation**:

| Plan     | Credits (default) | Period   |
|----------|-------------------|----------|
| Free     | 50                | One-time |
| Hobby    | 100               | Monthly  |
| Standard | 250               | Monthly  |
| Growth   | 500               | Monthly  |

One crawl ≈ 50 credits. Adjust via env: `FIRECRAWL_CREDITS_FREE=50`, `FIRECRAWL_CREDITS_HOBBY=100`, etc.

Set `users.firecrawl_plan` (default: `free`). Monthly plans reset each month.

## Flow

### Scan (landing page)
- Uses Firecrawl crawl (50 pages max) = up to 50 credits per scan
- **Cache check**: If we have content for a customer with same website hostname, return page count from DB **without crawling** (0 credits)
- Scan is typically pre-login; uses shared Firecrawl account credits

### Crawl (Build my chatbot)
- Requires auth
- **Per-user credits**: Check `credit_usage` before crawl
- Each page = 1 credit. Max 50 per crawl
- If insufficient credits → 402
- After crawl: deduct actual pages, set `customers.lastCrawledAt`

### Existing content
- If customer has content: "Refresh" = full re-crawl, deducts credits
- If no content: "Build" = first crawl, deducts credits
- Use existing content in chat (no credits) until they refresh

## Migration

Run `docs/migrations/001-credits.sql` in Neon to add:
- `users.firecrawl_plan`
- `credit_usage` table
- `customers.last_crawled_at`
