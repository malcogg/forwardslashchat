# ForwardSlash.Chat – Developer Workflow (Manual Fulfillment)

This is your step-by-step guide for fulfilling orders manually. Use Cursor, v0.dev, GitHub, and Vercel to go from order → live chat page.

---

## Your Stack

| Tool | Use |
|------|-----|
| **Cursor** | Build pages, API routes, edit code |
| **v0.dev** | Generate UI components, connect to GitHub, PR flow |
| **GitHub** | Source control, v0 pushes here |
| **Vercel** | Deploy from GitHub |
| **Firecrawl** | Scrape customer website → structured data |

---

## End-to-End Flow (Order In → Chat Live)

```
Order arrives (Stripe/PayPal)
    ↓
1. Log order, send thank-you email
    ↓
2. Run Firecrawl on customer URL
    ↓
3. Validate & clean Firecrawl output
    ↓
4. Create customer config (domain, branding, content)
    ↓
5. Build /chat page with Cursor (or duplicate + customize)
    ↓
6. Push to GitHub (via Cursor or v0)
    ↓
7. Deploy on Vercel
    ↓
8. DNS: customer adds CNAME (or you help if +$100)
    ↓
9. QA → delivery email
```

---

## Step 1: Order Comes In

- [ ] Check Stripe/PayPal for payment
- [ ] Add row to tracking sheet: customer, email, URL, subdomain, bundle, DNS help?
- [ ] Send thank-you email (template)
- [ ] Create folder: `customers/[date]-[business-slug]/`

---

## Step 2: Run Firecrawl

### How to run

- Use Firecrawl API or dashboard
- Input: customer's website URL (e.g. `https://frankgayservices.com`)
- Output: structured JSON (services, FAQs, contact, company background) or raw markdown

### What you need from Firecrawl

| Field | Use |
|-------|-----|
| `service_descriptions` | Services with name, description, source URL |
| `frequently_asked_questions` | Q&A pairs with citations |
| `contact_information` | Phone, email, address |
| `company_background` | About text |

### Save output

- Save raw output to: `customers/[slug]/firecrawl-output.json`
- Keep a copy; you'll use it to build the chat context and system prompt

---

## Step 3: Validate & Clean Firecrawl Data

### Checklist

- [ ] Services list is complete (no obvious gaps)
- [ ] FAQs have real Q&A, not placeholders
- [ ] Contact info is present and correct
- [ ] No junk/navigation/ads in content
- [ ] Source URLs work (spot-check a few)

### If data is bad

- Re-run crawl with different Firecrawl params
- Or manually add missing services/FAQs from their site
- For very sparse sites: ask customer for extra files (PDF, doc)

### Normalize for your app

Convert to the format your chat API expects, e.g.:

```json
{
  "pages": [
    { "url": "...", "title": "...", "content": "...", "description": "..." }
  ],
  "contact": { "phone": "...", "email": "...", "address": "..." },
  "company": "..."
}
```

Save as: `customers/[slug]/content.json`

---

## Step 4: Create Customer Config

Create a config record (KV, JSON, or DB) with:

```json
{
  "customerId": "cust-abc123",
  "businessName": "Frank Gay Services",
  "domain": "frankgayservices.com",
  "subdomain": "chat",
  "fullHost": "chat.frankgayservices.com",
  "primaryColor": "#...",
  "logoUrl": "https://...",
  "welcomeMessage": "Hi! How can we help?",
  "prepaidUntil": "2027-02-10",
  "contentKey": "cust-abc123:content"
}
```

- Store `content.json` in KV/DB under the customer ID
- Store system prompt (role, tone, safety rules) for this customer

---

## Step 5: Build /chat Page with Cursor

### Option A: Reuse shared chat component

- You have one `app/chat/page.tsx` (or similar) that reads `customerId` from host/middleware
- Add this customer to your config/KV
- No new page; just new data
- Deploy once, all customers use same code

### Option B: Per-client page (if you want isolation)

1. Duplicate your base chat template
2. Create route: `app/chat/[customerSlug]/page.tsx` or use host-based routing
3. In Cursor: paste in content from `content.json`, wire to API
4. Ensure middleware maps `chat.theirdomain.com` → this customer's config

### What the page needs

- ChatGPT-style UI (messages, input, streaming)
- Loader/typing indicator
- Markdown rendering in replies
- Branding: their color, logo, welcome message
- Calls `/api/chat` with `customerId` (from host or slug)

### Cursor prompts that help

- "Use the content in `content.json` to build the context for the chat API"
- "Create a ChatGPT-style chat UI with streaming, loader, and markdown"
- "Apply primaryColor and logoUrl from config to the chat header"

---

## Step 6: Push to GitHub

### Via Cursor

1. Stage changes: `git add .`
2. Commit: `git commit -m "Add customer: [business name]"`
3. Push: `git push origin main`

### Via v0.dev

1. If you generated UI in v0: connect project to GitHub
2. v0 creates a PR or pushes to your branch
3. Merge PR in GitHub

### Branch strategy (optional)

- `main` = production
- `customers/[slug]` = per-customer branch, then merge when ready  
  OR just work on `main` for now if solo.

---

## Step 7: Deploy on Vercel

- Vercel deploys from GitHub on push to `main`
- Or trigger deploy manually in Vercel dashboard
- Ensure project has wildcard domain if using `*.forwardslash.chat` for demo
- Customer domains: add `chat.theirdomain.com` in Vercel project settings when DNS is set

### Vercel project settings

- Root directory: `/` (or your app root)
- Framework: Next.js
- Build command: `next build` (or default)
- Add domain: `cname.forwardslash.chat` (your CNAME target)
- Per customer: `chat.theirdomain.com` (add when they're ready)

---

## Step 8: DNS

### If customer does it (base)

- Send them CNAME instructions from `docs/dns-instructions-reference.md`
- Add `chat.theirdomain.com` in Vercel once they confirm

### If you help (+$100)

- Get their DNS provider + access (API token or login)
- Add CNAME: `chat` → `cname.forwardslash.chat` (or your Vercel URL)
- If they want `theirdomain.com/chat`: set up reverse proxy (Cloudflare Worker, etc.)
- Add domain in Vercel when done

### Verify

- `nslookup chat.theirdomain.com` or use online DNS checker
- Visit `https://chat.theirdomain.com` — should load your chat

---

## Step 9: QA & Delivery

- [ ] Ask 5–10 test questions in the chat
- [ ] Check: answers grounded, no bad hallucinations, contact info correct
- [ ] Mobile check
- [ ] Send delivery email with live URL and DNS instructions (if self-setup)

---

## Quick Reference: File Locations

| Item | Location |
|------|----------|
| Firecrawl output | `customers/[slug]/firecrawl-output.json` |
| Cleaned content | `customers/[slug]/content.json` |
| Customer config | KV/DB or `customers/[slug]/config.json` |
| Chat page | `app/chat/page.tsx` (shared) or per-slug |
| Chat API | `app/api/chat/route.ts` |
| Middleware | `middleware.ts` (host → customerId) |

---

## Cursor Workflow Tips

1. **One customer at a time** – Finish one order before starting the next
2. **Keep a template** – Duplicate a working `content.json` + config as a starter
3. **System prompt** – One base prompt; customize tone/emergency rules per customer
4. **v0 for UI** – Use v0 to generate chat UI, then copy into Cursor and wire up your API

---

## When You're Ready to Automate More

- Firecrawl webhook → auto-save content on crawl complete
- Admin dashboard → trigger crawl, see content, approve, go live
- Auto-add customer to KV/DB from admin form
- Cloudflare API → auto CNAME when they give token

For now: manual, repeatable, one order at a time.
