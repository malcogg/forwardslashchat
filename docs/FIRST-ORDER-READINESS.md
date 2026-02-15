# ForwardSlash.Chat - First Order Readiness Checklist

Use this checklist to confirm you're ready to accept and fulfill your first paid order.

Last updated: February 2026

## Pre-Launch (before first order)

### Landing & Conversion
- [ ] Landing page live (hero, URL input, Scan button)
- [ ] Scan modal flow (loading -> results with page count)
- [ ] Pricing modal (tier auto-selected by page count)
- [ ] DNS upsell checkbox (+$99)
- [ ] PayPal and/or Stripe checkout wired
- [ ] Post-payment: required sign-up (Google, Apple, or email) before dashboard
- [ ] Redirect to dashboard only after account created

### Demo
- [ ] Demo chat live at /chat/demo or demo.forwardslash.chat
- [ ] Demo uses hardcoded content (e.g. Demo Coffee)
- [ ] Demo shows ChatGPT-style UI and streaming

### Chat (Customer-Facing)
- [ ] Vercel AI Chatbot template deployed and customized
- [ ] Multi-tenant middleware (Host header -> customerId)
- [ ] Chat API loads content by customerId, calls LLM
- [ ] At least one test customer config + content (e.g. Frank Gay) for QA

### Backend & Data
- [ ] Firecrawl API working (or crawl endpoint)
- [ ] KV/DB for customer config and content
- [ ] Admin route or manual process to add customers

### DNS & Domains
- [ ] cname.forwardslash.chat (or your Vercel target) configured
- [ ] DNS instructions doc ready to send
- [ ] Test: add a domain in Vercel, verify CNAME works

### Internal
- [ ] Order tracking sheet (Notion, Airtable, or spreadsheet)
- [ ] Thank-you email template
- [ ] Delivery email template
- [ ] Dev workflow doc (DEV-WORKFLOW-MANUAL-FULFILLMENT.md) reviewed

## When First Order Arrives

- [ ] Confirm payment (Stripe/PayPal)
- [ ] Log in tracking sheet
- [ ] Send thank-you email
- [ ] Run Firecrawl on their URL
- [ ] Validate content, create config
- [ ] Add customer to KV/DB
- [ ] Add domain in Vercel
- [ ] QA chat with test questions
- [ ] Send DNS instructions (if self-setup) or do it for them (+$99)
- [ ] Send delivery email with live URL

## Reference Docs

- `DEV-WORKFLOW-MANUAL-FULFILLMENT.md` - Step-by-step fulfillment
- `dev-instructions.md` - Developer checklist per order
- `INTERNAL-WORKFLOW.md` - Internal SOP
- `dns-instructions-reference.md` - CNAME copy-paste blocks
