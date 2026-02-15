# ForwardSlash.Chat - What to Do When You Get a New Order

This document is for you (the developer). It is the exact checklist and actions
to take after receiving a paid order.

Last updated: February 2026  
Current pricing: 1-5 year bundles ($550-$1,950), with optional $100 DNS setup help

## 1. Immediate actions (within 1 hour)

- Confirm payment (PayPal primary, Stripe fallback)
  - Note down:
    - Payment ID / Charge ID
    - Amount paid
    - Bundle chosen (1y $550 / 2y $850 / 3y $1,250 / 4y $1,600 / 5y $1,950)
    - Whether they paid extra $100 for DNS help
- Create a new row in your order tracking sheet (Google Sheets / Notion / Airtable)
  - Columns:
    - Order date
    - Customer name
    - Email
    - Payment ID
    - Bundle / amount
    - DNS help? (yes/no)
    - Website URL
    - Desired subdomain (chat / ai / support / etc.)
    - Status (New -> Content Gathering -> Crawling -> Indexing -> Deployed -> Delivered)
    - Prepaid until date (based on bundle)
    - Folder link (Google Drive / Dropbox)
- Send thank-you and next steps email (template or Resend / Gmail)
  - Confirm payment and bundle
  - Expected delivery: 3-10 business days
  - Ask for:
    - Website URL confirmation
    - Desired subdomain (chat, ai, support, help, assistant)
    - Brand colors (hex code or description)
    - Logo URL or file
    - Welcome message (if they have one)
    - Extra files (PDFs, docs, FAQs, product lists)
  - If DNS help paid: ask for DNS provider and access method

## 2. Content collection and preparation (Day 1)

- Create folder:
  - `/customers/[order-date]-[business-name-or-slug]`
  - Example: `2026-02-15-acme-plumbing`
- Save everything they send there:
  - Website URL
  - Files (PDFs, Google Docs export, text)
  - Branding info (colors, logo URL/file, welcome message)
- If anything important is missing, send a reminder email.

## 3. Crawl the website

- Use Firecrawl.dev (preferred) -> API call -> clean markdown output
- Fallback options:
  - Jina.ai reader
  - Custom script (axios + cheerio)
- Save raw markdown to folder: `raw-website.md`
- Optional framework check (headers/meta):
  - WordPress -> try `/wp-json/wp/v2/pages`
  - Shopify -> try `/products.json`
  - Helps decide crawl strategy

## 4. Clean and chunk content

- Remove junk: navigation, footers, scripts, ads, repeated menus
- Split into chunks ~400-800 tokens each
- Save cleaned chunks: `chunks.json` or `chunks.txt`
- Keep track of source (page URL) for each chunk

## 5. Store content for MVP (no embeddings)

- Create per-customer content store:
  - Array of `{ url, title, content, description }`
- Save in KV/DB under customer ID
- Use keyword matching or page summaries to select top pages in chat

## 6. Create customer config

Create a JSON file or DB entry:

```json
{
  "customerId": "cust-abc123",
  "businessName": "Acme Plumbing",
  "domain": "acmeplumbing.com",
  "subdomain": "chat",
  "fullUrl": "https://chat.acmeplumbing.com",
  "primaryColor": "#2d6a4f",
  "logoUrl": "https://...",
  "welcomeMessage": "Hi! How can we help with plumbing today?",
  "prepaidUntil": "2027-02-10",
  "createdAt": "2026-02-15"
}
```

## 7. DNS / domain setup (if paid $100 extra)

- Get their desired subdomain
- Add CNAME record in their DNS provider:
  - Host/Name: chat (or whatever they chose)
  - Type: CNAME
  - Value: `cname.forwardslash.chat` (your Vercel target)
- Wait 5 minutes to a few hours for propagation
- Vercel auto-creates SSL certificate
- Test: open https://chat.acmeplumbing.com -> should load your app

If they do it themselves, wait for them to confirm or check manually.

## 8. Final testing

- Open the real URL
- Ask 5-10 realistic questions
- Verify:
  - Answers are accurate and grounded
  - Branding looks correct (colors, logo)
  - Mobile view is good
  - Loading speed is acceptable
  - No obvious hallucinations
- Fix anything broken (1-2 quick iterations usually)

## 9. Deliver to customer

- Send delivery email:
  - Subject: Your ForwardSlash.Chat is live!
  - Body includes:
    - Your chatbot is ready: https://chat.acmeplumbing.com
    - Prepaid until: [date]
    - Optional embed code: `<iframe src="https://chat.acmeplumbing.com" ...>`
    - 1-2 revisions included
    - Thank you + receipt
    - Optional renewal reminder (after prepaid period)

## 10. After delivery

- Move order to Delivered in tracking sheet
- Archive customer folder
- Add to renewal watch list (~30 days before prepaid end)
- If they ask for changes later -> treat as small paid update

## Quick one-page checklist

- Payment confirmed and recorded
- Customer info and files collected
- Website crawled and cleaned
- Chunks saved
- Content stored and indexed
- Config JSON / entry created
- DNS set up (if paid)
- Chatbot tested on real domain
- Delivery email sent
- Order marked Delivered

Goal: reduce time per order to under 2-3 hours once you are comfortable with the flow.
