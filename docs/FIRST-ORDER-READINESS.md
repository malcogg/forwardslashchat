# ForwardSlash.Chat - First Order Readiness Checklist

Use this checklist to confirm you're ready to accept and fulfill your first paid order.

**See [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) for detailed DONE vs TODO.**

Last updated: February 2026

## Pre-Launch (before first order)

### Landing & Conversion
- [x] Landing page live (hero, URL input, Scan button)
- [x] Scan/Roast modal (light homepage fetch → age/tech vibes, page estimate)
- [x] Pricing section (page-based tiers: <50, 50–200, 200–500, 500+; 1–2 years)
- [x] DNS add-on (+$99) in checkout
- [x] PayPal checkout wired (lead saved → redirect to PayPal.me)
- [ ] Post-payment: required sign-up before dashboard
- [ ] Redirect to dashboard after account created (manual: create order → send link with orderId)

### Demo
- [x] Demo chat live at /chat/demo
- [x] Demo uses hardcoded content (Demo Coffee)
- [x] Demo shows chat UI (keyword-based answers; add LLM later)
- [x] Demo CTAs → pricing and checkout with pages param

### Chat (Customer-Facing)
- [ ] Vercel AI Chatbot template deployed and customized
- [ ] Multi-tenant middleware (Host header → customerId)
- [ ] Chat API loads content by customerId, calls LLM
- [ ] At least one test customer config + content for QA

### Backend & Data
- [x] `FIRECRAWL_API_KEY` in Vercel + `.env.local`
- [x] Firecrawl API working (dashboard crawl → page count + content)
- [x] Neon Postgres + Drizzle (schema: users, scans, orders, customers, checkoutLeads)
- [x] POST /api/checkout/lead (saves form before PayPal)
- [x] POST /api/orders (create order + customer)
- [ ] Lead → order workflow when payment confirmed (manual for now; no PayPal webhook)
- [ ] Admin route or process to create customers from leads

### DNS & Domains
- [ ] cname.forwardslash.chat (or Vercel target) configured
- [x] DNS instructions doc (`dns-instructions-reference.md`) + CNAME in dashboard
- [ ] Test: add domain in Vercel, verify CNAME works

### Email (Resend)
- [x] Resend integration (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
- [x] Welcome email (Clerk webhook → user.created)
- [x] Payment reminder email (Vercel cron → users 2+ days no paid order)
- [x] Order confirmation template (component exists; trigger on payment)
- [ ] Thank-you email sent when payment confirmed (manual or webhook)
- [ ] Delivery email when chatbot is live
- [ ] Verify domain at resend.com/domains for production

### Internal
- [ ] Order tracking sheet (Notion, Airtable, or spreadsheet)
- [ ] [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) reviewed

## When First Order Arrives

- [ ] Confirm payment (check PayPal)
- [ ] Create order from checkout lead (manual or admin tool)
- [ ] Log in tracking sheet
- [ ] Send thank-you email
- [ ] Run Firecrawl on their URL (from dashboard or manually)
- [ ] Validate content, create customer config
- [ ] Add customer + order to DB
- [ ] Add domain in Vercel
- [ ] QA chat with test questions
- [ ] Send DNS instructions (self-setup) or do it for them (+$99)
- [ ] Send delivery email with live URL

## Reference Docs

- [APP-OVERVIEW.md](./APP-OVERVIEW.md) – Full app overview, services, roadmap
- [INVESTOR-PITCH.md](./INVESTOR-PITCH.md) – Investor pitch
- [PRODUCTION-READINESS-CHECKLIST.md](./PRODUCTION-READINESS-CHECKLIST.md) – DONE vs TODO, build order
- [DEV-WORKFLOW-MANUAL-FULFILLMENT.md](./DEV-WORKFLOW-MANUAL-FULFILLMENT.md) – Step-by-step fulfillment
- [dev-instructions.md](./dev-instructions.md) – Developer checklist per order
- [INTERNAL-WORKFLOW.md](./INTERNAL-WORKFLOW.md) – Internal SOP
- [dns-instructions-reference.md](./dns-instructions-reference.md) – CNAME copy-paste blocks
