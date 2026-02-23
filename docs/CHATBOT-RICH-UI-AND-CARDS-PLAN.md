# Customer Chatbot: Rich UI, Cards & Per-Customer Data

This doc captures where we are today, what we’re aiming for (ChatGPT/Expedia-style rich responses), and a concrete plan so the customer chatbot stands out with **blog cards, product cards, compact tip cards**, and optional **products, images, and pricing** per customer.

---

## Current State

### Per-customer LLM / data

- **RAG is per-customer:** `POST /api/chat` uses `customerId` and loads only that customer’s rows from the `content` table (crawled pages: `title`, `url`, `content`).
- **Content model:** `content` has `url`, `title`, `content` (text), `description`. No structured product fields (price, image, SKU) or blog metadata (image, date) yet.
- **System prompt:** Tells the model to answer using only that content and to “format responses in markdown.”

So we **do** train/retrieve per customer today; we do **not** yet have structured products/images/pricing or rich UI.

### Chat UI today

- **Component:** `components/CustomerChat.tsx` uses Vercel AI SDK `useChat` with `/api/chat` and `body: { customerId }`.
- **Assistant messages:** Rendered as a single block of text:  
  `{m.content}` in a `div` with `whitespace-pre-wrap` and `[&_a]:text-blue-600 [&_a]:underline`.
- **Gaps:**
  - Markdown is **not** rendered (no `react-markdown`); we show raw text.
  - No cards (product, blog, tip).
  - No images, no structured layout—just plain text and link styling.

So today we’re **not** using the “format in markdown” in a rich way, and we have **no** card or Expedia-style UI.

---

## Target Experience (What We Want)

- **ChatGPT-like:** Articles/summaries as rich blocks (title, snippet, image, link), not only paragraphs.
- **Expedia/Booking-style:** When the bot talks about “resorts” or “options,” show **compact cards** (image, title, price/CTA) that users can tap.
- **ForwardSlash.Chat-specific:**
  - **Product cards:** Image, name, price, short description, link (for e‑com or service “products”).
  - **Blog cards:** Image, title, excerpt, date, link.
  - **Compact tip cards:** Short helpful tip with optional icon/link.
- **Per-customer:** Products, pricing, images, and tips should come from **that customer’s** data (crawled or uploaded), not generic content.

---

## Plan Overview

| Phase | What | Outcome |
|-------|------|--------|
| **1** | Render markdown + safe HTML/links | Replies look like ChatGPT (bold, lists, links), no new backend contract. |
| **2** | Add card components + structured message format | Assistant messages can include text + cards (product/blog/tip). |
| **3** | Per-customer structured data (products, blogs) | LLM can reference real products/pricing/images; we render them as cards. |

---

## Phase 1: Markdown & Better Text (Quick Win)

**Goal:** Stop showing raw markdown; render it so the chat feels modern (bold, lists, links).

**Changes:**

1. **Frontend**
   - In `CustomerChat.tsx`, for assistant messages, render `m.content` with **react-markdown** (or similar).
   - Use `remark-gfm` for tables, and safe defaults (no arbitrary HTML unless you add `rehype-raw` and sanitize).
   - Keep existing link styling; optionally add typography (headings, lists, code).

2. **Backend**
   - No change. Keep “Format responses in markdown” in the system prompt.

**Deliverable:** Same API, same content; replies look like ChatGPT-style formatted text instead of plain blocks.

---

## Phase 2: Card Components & Structured Responses

**Goal:** Support **product cards**, **blog cards**, and **compact tip cards** inside assistant messages, with a clear contract between API and UI.

### Option A — Structured blocks in the stream (recommended)

- **Idea:** The API returns a **single assistant message** that can contain:
  - `content`: string (markdown) — main reply text.
  - `blocks`: array of card objects — rendered as cards below or inline with the text.

- **Shape of a block (example):**

```ts
type CardBlock =
  | { type: "product"; title: string; price?: string; image?: string; url?: string; description?: string }
  | { type: "blog";   title: string; excerpt?: string; image?: string; url?: string; date?: string }
  | { type: "tip";    title: string; body?: string; icon?: string };
```

- **Backend:** After the model reply is ready (or in parallel), either:
  - **2a.** Have the LLM output a strict format (e.g. JSON block at the end of the message) and parse it server-side, then send `content` + `blocks` in the response, or  
  - **2b.** Use a second step: “card extraction” that takes (customerId, assistantMessage) and runs a small model or rules to find product/blog/tip mentions and fills `blocks` from per-customer data (see Phase 3).

- **Frontend:** `CustomerChat` checks for `message.parts` or `message.blocks` (depending on how we extend the AI SDK message type). For each block, render:
  - `ProductCard` (image, title, price, CTA)
  - `BlogCard` (image, title, excerpt, date, link)
  - `CompactTipCard` (icon, title, short body)

- **Streaming:** Either send text first (as now), then append a non-streamed “blocks” payload at the end of the message, or define a small streaming protocol (e.g. text stream + one final JSON line for blocks). Easiest: stream text as today; add `blocks` in the final message payload when using a non-streaming response, or send blocks in a separate field after stream end.

### Option B — Markdown-based cards

- **Idea:** Keep a single text stream; use a custom markdown “syntax” for cards, e.g.  
  `:::product title="X" price="Y" image="Z" url="..." :::`  
  and parse it in the frontend to render card components.
- **Pros:** No change to streaming shape. **Cons:** Fragile (model must follow the format), harder to pass structured data (e.g. multiple products).

### Recommendation

- Use **Option A** for product/blog/tip cards so we have a clear, typed contract and can later drive blocks from real per-customer data (Phase 3).
- Keep streaming for the **text** part; add **blocks** either in the same message object (when stream completes) or in a follow-up payload.

---

## Phase 3: Per-Customer Products, Images, Pricing

**Goal:** So that “products,” “pricing,” and “images” in the chat are real and on-brand, we need **per-customer structured data** that the LLM can use and we can turn into cards.

### Data model options

1. **Extract from crawl**
   - During or after crawl, parse pages for:
     - Schema.org `Product` (name, image, price, url).
     - Blog-like content (title, excerpt, image, date, url).
   - Store in tables, e.g.:
     - `customer_products`: customerId, title, price, imageUrl, productUrl, description, etc.
     - `customer_blog_posts`: customerId, title, excerpt, imageUrl, url, publishedAt.
   - RAG: Include these in context (e.g. “Available products: …”) and/or retrieve by semantic search. When the model mentions a product, we map it back to a row and add a `product` block for the UI.

2. **Dashboard upload (future)**
   - Let the business add “products” or “featured posts” in the dashboard (name, price, image, link). Same tables as above; same RAG + card flow.

3. **Hybrid**
   - Crawl extracts what it can; dashboard allows override/add. LLM answers from RAG that includes both crawled content and structured products/blogs.

### Training the LLM on this data

- **Today:** We already inject “Website content” (from `content` table) into the system prompt; that’s our per-customer “training” (RAG).
- **With products/blogs:** Add a second section to the system prompt, e.g. “Products: …” and “Blog posts: …” (or a short structured summary). Instruct the model to cite products/blogs when relevant and to use a consistent format (e.g. product ID or title) so we can resolve to a row and render a **product card** or **blog card**.
- **Structured output:** When we have `customer_products` / `customer_blog_posts`, we can:
  - Either have the model output structured blocks (e.g. “PRODUCT: id=…” or a short JSON block we parse), or
  - Run a post-pass: match product/blog titles or URLs from the reply to our DB and attach `blocks` to the message.

---

## What We’re Doing About It (Summary)

| Topic | Status / Plan |
|-------|----------------|
| **Per-customer training** | Already doing it: RAG per `customerId` from `content` table. |
| **Products / images / pricing** | Not yet. Phase 3: add `customer_products` (and optionally blog) from crawl or dashboard, and feed into RAG + cards. |
| **Rich UI (not plain text)** | Phase 1: Add markdown rendering so replies look like ChatGPT. |
| **Blog / product / tip cards** | Phase 2: Define `content` + `blocks` (product/blog/tip), add card components, and optionally a card-extraction step. Phase 3: Back cards with real per-customer data. |
| **Standout chatbot UI** | Phase 1 + 2 + 3 together: formatted text + cards + real products/pricing/images. |

---

## Suggested Next Steps (Ordered)

1. **Phase 1 (short-term):** Add `react-markdown` (and optionally `remark-gfm`) to `CustomerChat.tsx` for assistant messages so we render markdown and links properly. No API change.
2. **Phase 2 (next):** Design and implement `ProductCard`, `BlogCard`, `CompactTipCard` in the chat UI; extend the chat API to support an optional `blocks` (or `parts`) array on the assistant message; implement either LLM-output parsing or a small “card extraction” step that attaches blocks to the message.
3. **Phase 3 (later):** Add schema and crawl/dashboard for per-customer products (and optionally blogs); integrate into RAG and into the card pipeline so the bot can show real products, images, and pricing in the chat.

If you want to prioritize one of these (e.g. “do Phase 1 and a minimal Phase 2 with tip cards only”), we can break that into concrete tasks and file/API changes next.
