# ForwardSlash.Chat MVP PRD

## Executive Summary

ForwardSlash.Chat delivers a fully branded AI chatbot for small and local
businesses. Customers pay upfront for a custom chatbot trained on their website
and files. Hosting and maintenance are included for the prepaid period, and
renewals after that are optional. The MVP prioritizes fast fulfillment and
operational simplicity for the first 50-100 customers while establishing a
scalable multi-tenant foundation.

## Target Customers and Early Scope

- Local service businesses (home services, clinics, agencies, retail)
- Non-technical owners who want a fast, professional chatbot
- Early scope: first 50-100 customers fulfilled manually or semi-manually

## Value Proposition and Pricing Rules

- Upfront bundles with free hosting/maintenance for year one
- Renewal after the included period is optional (see app for rate)
- Recommended default: 2-year option for chosen tier
- Optional add-on: DNS setup help +$99
- No monthly fees, no usage limits, no token billing
- Delivery in 3-10 business days
- Customer must map their own subdomain via CNAME
- Payment: PayPal primary, Stripe fallback

### Pricing (page-based tiers)

- Up to 50 pages: $799 (1yr), $1,099 (2yr)
- 51–200 pages: $1,499 (1yr), $2,099 (2yr)
- 201–500 pages: $2,999 (1yr), $3,999 (2yr)
- 500+ pages: contact for pricing  
See docs/pricing-and-bundles.md for details.

## MVP Goals

1. Deliver a high-quality, branded chatbot in 3-10 days.
2. Reduce per-customer fulfillment time to under 4 hours.
3. Ensure safe, grounded answers with clear source alignment.
4. Operate a single scalable app that supports 100 customers.

## MVP Non-Goals

- Full self-serve onboarding and automatic provisioning
- Advanced analytics dashboard for customers
- Multi-language support beyond English
- Live integrations with CRMs or ticketing systems
- Vector embeddings or semantic search in MVP

## Core User Journeys

### Buyer Journey

1. Customer selects a bundle and pays upfront (+$100 if DNS help).
2. Provides website URL, subdomain, branding, and optional files.
3. Receives chatbot link on their own domain.

Note: Landing page uses a modal-first flow after "Scan Website". Scan, results,
and pricing are handled in a full-screen modal or bottom sheet.

### Internal Fulfillment Journey

1. Confirm payment.
2. Crawl website and process content.
3. Store content for retrieval (no embeddings).
4. Configure customer settings.
5. Test, deploy, and deliver.

### End User Chat Journey

1. Visitor opens chatbot on customer domain.
2. Asks a question.
3. Receives a fast, accurate, grounded answer.

## Functional Requirements

### Chat UI

- ChatGPT-style interface with branding (colors, logo, welcome message).
- Mobile responsive, fast load time.
- Message streaming and typing states.

### Content Ingestion

- Crawl customer website to clean markdown.
- Support optional uploads: PDFs, Google Docs, FAQs.
- Chunk content to 400-800 token segments.

### Content Retrieval (no embeddings in MVP)

- Store per-page content `{ url, title, content, description }`.
- Use keyword match or page summaries to select top pages.
- Ask the LLM to answer using only provided content.

### Customer Configuration

- Store per-customer config with:
  - Business name
  - Domain and subdomain
  - Brand colors and logo
  - Welcome message and optional tone

### Multi-Tenant Routing

- Middleware detects hostname.
- Load correct customer config.
- API requests are scoped to that customer ID.

### Deployment

- Single Next.js app serving all customers.
- No per-customer deploys for MVP.
- Vercel wildcard DNS used for routing.

## Operational Workflow Mapping

1. Intake and tracking (PayPal/Stripe + spreadsheet/Notion).
2. Content collection and crawl.
3. Content storage and indexing.
4. Customer config creation.
5. QA on real domain.
6. Delivery email and handoff.

Reference: `docs/INTERNAL-WORKFLOW.md`

## Technical Architecture (MVP)

### Frontend

- Next.js 15 (App Router) with dynamic routing.
- Tailwind + shadcn/ui for UI components.
- Public chat UI under customer subdomain.

### Backend

- API routes for chat and retrieval (Vercel AI SDK).
- Internal admin routes for fulfillment.

### Storage

- Configs and content in Postgres or KV.
- Assets in object storage (S3/R2).

### Authentication

- Clerk or NextAuth (Google + email/password).

### Payments

- PayPal primary with Stripe fallback.

### Crawler

- Firecrawl.dev API or Jina.ai reader.

### AI Providers

- Groq / Gemini / OpenAI for completion.

## Safety and Quality Guardrails

- Responses must be grounded in retrieved content.
- If no relevant chunks found: respond with fallback message.
- Avoid claims outside customer content.
- Basic QA checklist before delivery.

## Metrics and Acceptance Criteria

- Delivery time: 3-10 business days.
- Internal fulfillment time: under 4 hours per order.
- Chat uptime: 99%+.
- QA pass rate: 95%+ in test questions.
- First-response latency: under 3 seconds.

## Risks and Mitigations

- Crawl blocked or incomplete -> fallback to manual extraction or user files.
- Large sites -> limit crawl depth or ask for priority pages.
- DNS delays -> clear instructions and optional paid setup.
- Quality issues -> QA checklist + revision allowance.

## Post-MVP Roadmap

1. Self-serve onboarding and automated provisioning.
2. Customer dashboard for settings and analytics.
3. Automated QA checks and monitoring alerts.
4. Multi-language support.

## Appendix: Required Customer Inputs

- Website URL
- Desired subdomain
- Brand colors
- Logo URL or file
- Welcome message
- Optional tone or personality
- Optional uploaded files
