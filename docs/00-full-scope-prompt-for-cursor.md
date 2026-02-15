# ForwardSlash.Chat - Full Scope and Prompt for Cursor (MVP Build Instructions)

This is the complete high-level brief for building ForwardSlash.Chat MVP.  
Use this document as your main guide when generating code, architecture,
components, and flows.

## Product Overview

ForwardSlash.Chat is a one-time payment service that lets small/local businesses
get a custom, ChatGPT-style AI chatbot trained on their own website.

Key promises:

- No monthly subscription, no per-message fees
- One-time payment covers chatbot creation plus hosting/maintenance for the
  prepaid period (1-5 years)
- Chatbot lives on the customer's own domain (for example, chat.theirbusiness.com)
- We crawl their website -> the bot answers using real content from their site
- Simple, fast, trustworthy experience for non-technical users

## Pricing (locked in)

| Bundle         | Price  | Prepaid period | Renewal after | Notes                                   |
|----------------|--------|----------------|---------------|-----------------------------------------|
| 1-Year Starter | $550   | 1 year         | $495/year     | First year hosting/maintenance included |
| 2-Year Bundle  | $850   | 2 years        | $495/year     | Recommended - saves $190                |
| 3-Year Bundle  | $1,250 | 3 years        | $495/year     |                                         |
| 4-Year Bundle  | $1,600 | 4 years        | $495/year     |                                         |
| 5-Year Bundle  | $1,950 | 5 years        | $495/year     | Max upfront cash                        |

Optional add-on: $100 one-time upsell for DNS setup help.

## How It Works - User Flow (customer perspective)

1. Lands on forwardslash.chat
   - Sees hero, demo link, large URL input
   - Enters website URL, clicks "Scan Website"

2. Scan flow (full-screen modal)
   - Loading: cycling messages ("Reading homepage...", "Finding services...", etc.)
   - Results: "We found X pages on your site"
   - Confidence block + trust summary

3. Pricing modal (auto-selected by page count)
   - Page count from scan determines tier:
     - Under 300 pages -> Small
     - 300-1,000 -> Medium
     - 1,000-5,000 -> Large
     - 5,000+ -> Enterprise (Contact us)
   - "Your Price" - tier pre-selected; customer doesn't have to think
   - Checkbox: "Help me add DNS (+$99)"
   - Continue to Payment

4. Enters basic info (before or after scan)
   - Business name, desired subdomain (chat / ai / support / etc.)
   - Optional: upload files

5. Pays
   - PayPal checkout (Stripe fallback)

6. Creates account (required - must sign up after payment to access dashboard)
   - Google sign-in preferred or email/password
   - No dashboard access until they complete sign-up

7. Goes to dashboard
   - Sees order status, estimated delivery, DNS instructions
   - Can upload more files or request small changes

8. We build and deliver (internal)
   - Crawl site -> save content
   - When user asks a question -> find relevant pages -> respond in chat
   - Chatbot goes live on their domain once CNAME is set

## Technical Approach - MVP Scope (no embeddings at first)

Goal: fast MVP that beats hardcoded answers.  
Start with simple content retrieval plus LLM summarization (no vector embeddings).

### Core Architecture

- Frontend: Next.js 15 (App Router), Tailwind, shadcn/ui
- Backend: Next.js API routes (serverless on Vercel)
- Hosting: Vercel (single app, multi-tenant)
- Authentication: Clerk or NextAuth (Google + email/password)
- Database: Vercel KV / Upstash Redis / Neon Postgres
- Payment: PayPal (primary) + Stripe fallback
- Crawler: Firecrawl.dev API (clean markdown) or Jina.ai reader
- LLM: Groq or Gemini 1.5 Flash / OpenAI GPT-4o-mini
- Chat: Vercel AI SDK (`useChat`) with markdown rendering

### No embeddings for MVP - simplified retrieval

1. Crawl site -> list of pages + clean markdown per page
2. Store per customer: array of `{ url, title, content, description }`
3. When user asks a question:
   - Send question + summaries of all pages (or top N by keyword match) to LLM
   - Prompt: "Answer using only the provided website content. Include links,
     excerpts, lists, images if relevant. Format nicely."

### Multi-tenant Routing

- Middleware:
  - Reads host header
  - Extracts subdomain (chat -> customerId)
  - Loads customer config (DB/KV)
  - Rewrites request to include customerId

- Chat API route:
  - Uses customerId to fetch correct content
  - Calls LLM with scoped context

### Dashboard (MVP - very simple)

Pages:

- /dashboard
  - Order status card (timeline or progress bar)
  - Chatbot URL (once live)
  - DNS instructions section (copy-paste CNAME block + provider guides)
  - Upload extra files button
  - Request change form (1-2 revisions included)
  - Prepaid until date

### Internal Admin Tool (for you)

Protected route: /admin/new-customer

- Form: url, subdomain, colors, logo, welcome message
- Button: "Process this customer" -> triggers crawl + content save

## MVP Build Order (what Cursor should help with first)

1. Set up Next.js project structure (App Router, Tailwind, shadcn/ui)
2. Authentication (Clerk or NextAuth - Google login)
3. Landing page and pricing table
4. Checkout flow (PayPal + Stripe)
5. Post-payment dashboard skeleton
6. Middleware + multi-tenant hostname routing
7. Crawl endpoint (Firecrawl integration)
8. Simple content storage per customer
9. /api/chat route (question -> find relevant pages -> LLM -> stream answer)
10. DNS instructions page / component
11. Admin tool for manual customer creation

## Non-Goals for MVP

- Vector embeddings / semantic search (add later)
- Customer dashboard analytics
- Embed widget (full-page chat only for now)
- Multi-language
- Complex visual builder
- Live integrations (CRM, Slack, etc.)

## Success Criteria for MVP

- Customer pays -> chatbot appears on their domain in under 30 minutes
  (after they add CNAME)
- Answers feel helpful and grounded in their site content
- Dashboard shows clear status and DNS steps
- You can fulfill one order in under 30 minutes manually

Use this document as your primary reference when building.  
Generate code, components, routes, and prompts based on this scope.
