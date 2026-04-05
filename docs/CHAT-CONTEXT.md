# Customer chat: context and limits (pre-RAG)

This document describes how **production customer chat** (`POST /api/chat`) builds what the model sees today. It is **not** semantic retrieval: there are no embeddings or chunk ranking yet (see **P2 RAG** in `TODO.md`).

## Retrieval strategy

1. Load all rows from `content` for the `customerId`.
2. Sort by `created_at`, then `url` (stable, reproducible ordering).
3. **Stuffing:** concatenate each page as a markdown block until a **character budget** is reached:

   ```text
   ## {title}
   URL: {url}

   {content}

   ---

   (next page…)
   ```

4. If the next whole page would exceed the budget, **stop**. That page and any later rows are **omitted** (no partial-page fill).

5. The result is embedded in the **system** prompt. The model is instructed to answer only from that text.

**Implications**

- Questions whose answers live only on pages **after** the cut are more likely to get “I don’t have that in your site content.”
- Very large sites are underrepresented beyond the cap even if many pages were crawled.
- Order is **not** “most relevant to the user message”; relevance is left to the model within the stuffed excerpt.

## Limits (server-side)

| Concern | Default | Override (env) | Notes |
|--------|---------|----------------|--------|
| Crawled text in system prompt | 60,000 characters | `CHAT_CONTEXT_MAX_CHARS` | Clamped 8,000–120,000 in code. |
| Recent turns in request | 12 messages | `CHAT_HISTORY_MESSAGES` | Clamped 2–32. User/assistant strings passed through `sanitizeChatMessage` (2,000 chars each, `LIMITS.chatMessage` in `lib/validation.ts`). |
| Completion length | 600 tokens | `CHAT_MAX_TOKENS` | Clamped 128–1200. |
| Requests per minute (per customer) | 30 | `CHAT_RATE_LIMIT_PER_MINUTE` | Clamped 5–120. |

Constants and helpers live in `lib/chat-context.ts`. Wiring is in `app/api/chat/route.ts`.

## What is *not* in the LLM context

- **Product / blog cards** in the UI come from `POST /api/chat/extract-blocks` (separate DB tables). That route matches structured data to the assistant’s reply for rich UI; it does **not** replace the stuffed website text for the main chat completion.

## Demo chat

`POST /api/chat/demo` reads `data/demo-content.json`, uses a **10**-message history slice, and **`DEMO_CHAT_MAX_TOKENS`** (default 400) for output. It does not use `lib/chat-context.ts` today; keep demo content small.

## Future (RAG)

Planned direction: chunk crawled content, embed, retrieve **top-k** by similarity to the user query, then inject only those chunks (plus citations). Until then, operators should treat **`CHAT_CONTEXT_MAX_CHARS`** as the main lever for cost vs. coverage.
