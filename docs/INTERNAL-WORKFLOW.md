# ForwardSlash.Chat - Internal Fulfillment Workflow

This document describes how we fulfill an order (page-based tier, 1 or 2 years; see pricing-and-bundles.md), from payment confirmation until the customer receives their working chatbot.

Current stage: manual / semi-manual (first ~50-100 customers)  
Goal: automate as much as possible after validation

## Overview - What we promise the customer

- One-time upfront payment for chosen tier (1 or 2 years)
- Full custom AI chatbot trained on their website plus optional uploaded files
- Branded ChatGPT-style interface
- Hosting and maintenance included for the full prepaid period
  - Year 1 always included free; years 2+ included if multi-year bundle purchased
- Delivered in 3-10 business days
- Customer must point their own domain/subdomain via CNAME record
- Optional renewal after prepaid period (price subject to change)

## Tools and accounts needed (keep updated)

- PayPal (primary) + Stripe dashboard (fallback payments)
- Vercel account + project (wildcard DNS already set up)
- Vercel KV / Upstash Redis / Neon Postgres (customer configs + content)
- Groq / Gemini / OpenAI API keys
- Firecrawl.dev or Jina.ai / custom crawler
- GitHub private repo (base Next.js project)
- Google Drive / Dropbox / email folder for customer files
- Notion / Trello / simple spreadsheet for order tracking
- Email (Resend / Gmail / whatever you use)

## Step-by-step internal workflow per order

### 1. Payment confirmation (0-1 hour after payment)

- Stripe webhook / manual check -> new payment
- Record in tracking sheet:
  - Customer name
  - Email
  - Order ID
  - Amount and tier (e.g. 2yr Up to 50 pages $1,099; see docs/pricing-and-bundles.md)
  - Prepaid years (1 / 2 / 3 / 4 / 5)
  - Website URL provided
  - Desired subdomain (chat / ai / support / etc.)
  - DNS choice (self or we help)
  - Any uploaded files (link or note)
- Send automated thank-you email:
  - Confirmation of payment and bundle selected
  - Prepaid period (years covered)
  - Estimated delivery: 3-10 business days
  - What happens next
  - If they chose "we help with DNS": ask for access/instructions

### 2. Gather and prepare customer content (Day 1)

- Customer provides:
  - Main website URL
  - Optional extra files (PDFs, Google Docs link, text paste)
- Save everything in dedicated folder:
  - `/customers/[order-id]-[business-name]`
- If files are missing -> gentle reminder email

### 3. Crawl and process website content

- Run website crawl:
  - Preferred: Firecrawl.dev API -> clean markdown output
  - Fallback: custom script (axios + cheerio) or Jina reader
- Framework detection (optional but helpful):
  - Check headers/meta for WordPress, Shopify, Webflow, etc.
  - Use faster endpoints if possible (wp-json, /products.json)
- Clean and chunk content:
  - Remove navigation, footers, scripts
  - Split into ~400-800 token chunks
  - Save raw markdown + chunks in customer folder

### 4. Create customer-specific data

- Generate unique identifier: `cust-[short-uuid]` or `[business-slug]`
- Create simple JSON config:
  ```json
  {
    "id": "cust-abc123",
    "businessName": "Acme Plumbing",
    "subdomain": "chat",
    "domain": "acmeplumbing.com",
    "primaryColor": "#2d6a4f",
    "logoUrl": "https://...",
    "welcomeMessage": "Hi! How can we help with plumbing today?",
    "prepaidUntil": "2027-02-10",
    "contentLastUpdated": "2026-02-15"
  }
  ```
- If they want custom tone/personality, add a field to the config.

### 5. Prepare content store (no embeddings in MVP)

- Save per-page content:
  - Array of `{ url, title, content, description }`
  - Store under customer ID in KV/DB
- Basic relevance:
  - Use keyword matching or page summaries to select top pages
- Test retrieval:
  - Ask 3-5 sample questions
  - Verify answers are accurate and grounded in page content

### 6. Deploy the chatbot instance

Recommended: Single app with dynamic routing

- Push customer config to database / JSON file / env
- Middleware detects hostname -> loads correct customerId
- Chat API route loads page content by customerId
- Deploy once -> all customers live on same codebase

Alternative (only if you are under 10 customers and want isolation):

- Per-customer clone and deploy

### 7. DNS / domain setup

If they paid $100 extra (we help):

- Customer sends:
  - Desired subdomain
  - DNS provider
  - Access method (API key / login / screenshot)
- Add CNAME record:
  - Host: chat (or whatever they chose)
  - Type: CNAME
  - Value: `cname.forwardslash.chat` (Vercel target)
- Wait for propagation (usually minutes)
- Vercel auto-issues SSL
- Test: `curl chat.acmeplumbing.com` -> should hit your app

If they do it themselves:

- Confirm they added it correctly (optional ping)

### 8. Final testing and delivery (Day 3-10)

- Test on real domain/subdomain:
  - Ask 5-10 realistic questions
  - Check branding, loading speed, mobile
  - Verify no hallucinations / bad answers
- Make 1-2 rounds of fixes if needed
- Send delivery email:
  - "Your chatbot is live: https://chat.acmeplumbing.com"
  - Prepaid period end date
  - Embed code (optional): `<iframe src="..." />`
  - How to request changes (1-2 revisions included)
  - Thank you + invoice receipt
  - Note about optional renewal after prepaid period

### 9. Post-delivery

- Archive order folder
- Add to renewal watch list (set a reminder ~30 days before prepaid end)
- If customer wants changes later -> treat as small paid update
- Track any support requests (rare at first)

## Quick checklist per order

- [ ] Payment confirmed
- [ ] Bundle recorded
- [ ] Content gathered
- [ ] Site crawled and cleaned
- [ ] Embeddings created and stored
- [ ] Config JSON ready (with prepaidUntil date)
- [ ] Chatbot deployed and tested
- [ ] DNS configured (self or us)
- [ ] Final test round
- [ ] Delivery email sent

## Estimated time per order (early stage)

- Small site (10-30 pages): 2-4 hours total
- Medium site (50-200 pages): 4-8 hours
- DNS help: +30-60 min
- Revisions: +1-2 hours

Goal: get to under 2 hours per order once the process is repeatable and partially scripted.

This is the realistic "behind the curtain" version with no marketing language.
Adjust tools, numbers, and limits as the process evolves.
