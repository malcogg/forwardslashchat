# ForwardSlash.Chat - Customer Dashboard (MVP)

This document defines the minimum dashboard experience for customers after
payment. Keep it simple and focused. No analytics, no complex settings.

**Important:** All users must sign up (create an account) after payment to
access the dashboard. No account = no dashboard access.

Last updated: February 2026

## Primary Goals

- Show clear order status and expected delivery date
- Provide DNS instructions front and center
- Allow customers to submit missing files or small change requests
- Display prepaid period end date

## Core Sections (MVP)

### 1. Order Status Card (most important)

Data to show:

- Current status
- Estimated delivery date range
- Simple timeline or progress bar

Suggested statuses:

- Payment confirmed
- Content collection
- Crawling website
- Indexing content
- DNS setup
- Testing
- Delivered

### 2. Chatbot Details

Data to show:

- Business name
- Website used for training
- Chosen subdomain
- Live URL (once DNS is set)
- Prepaid until date

Actions:

- Edit branding (limited): colors, logo, welcome message

### 3. DNS Setup Section

If customer paid for DNS help:

- Message: "We are preparing to set up your DNS. Please reply to the confirmation
  email with your DNS provider access details."
- Status: "Waiting for your DNS info"

If customer is self-setup:

- Button: "View DNS instructions"
- Copy-paste CNAME block:
  ```
  Type: CNAME
  Host/Name: chat
  Value/Points to: cname.forwardslash.chat
  TTL: Auto
  ```
- Links to guides: Cloudflare, GoDaddy, Namecheap, Squarespace
- Optional: "Already added? Verify" button

### 4. Next Steps / Help

Content to show:

- Short 3-step "what happens next"
- Upload extra files button
- "Request a change" form (1-2 revisions included)
- Support email link or simple contact form

## Post-Delivery View

When delivered:

- Status changes to Delivered
- Live URL and "Test your chatbot" button
- Optional embed code snippet
- Renewal reminder appears ~30 days before prepaid end

## MVP Exclusions

- Usage analytics
- Chat history for visitors
- Multi-chatbot accounts
- Advanced settings or integrations
