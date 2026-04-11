# Customer chat: context and limits

This document describes how **production customer chat** (`POST /api/chat`) builds what the model sees:

1. A **supplementary** block (always when data exists): company profile (`customers` row), **curated** `customer_products` / `customer_blog_posts`, and a **crawled page index** (titles + URLs) — see `lib/chat-supplementary-context.ts`.
2. **RAG** (query + optional **augment** embedding in one batch) over `content_chunks`, then **stuffing fallback** if RAG returns nothing — `lib/rag-retrieve.ts` (`retrieveChunksForCustomerChat`).

**Slash messages:** If the **last user message** is a known **`/command`** (e.g. `/pricing`), the server **replaces** it with a longer instruction before the messages are sent to the model (see `lib/chat-slash-commands.ts` and [CUSTOMER-CHAT-VISITOR-FEATURES.md](./CUSTOMER-CHAT-VISITOR-FEATURES.md)). The **retrieval query** uses that expanded text so RAG matches the same intent as the model.

## Retrieval strategy (RAG + fallback)

### Primary: pgvector top-k (when enabled)

1. Apply migration `docs/migrations/019-content-chunks-rag.sql` (enables `vector`, creates `content_chunks`).
2. After each successful crawl (auto or manual), `reindexCustomerContentChunks` in `lib/rag-index.ts` **chunks** each `content` row (`lib/text-chunking.ts`), calls **OpenAI embeddings** (`lib/rag-openai.ts`), and stores rows in `content_chunks` (cosine index via HNSW).
3. On each chat request, the **last user message** (after slash expansion) is embedded, plus a second **broad augment** query (default text in `resolveChatRagAugmentQueryText`) in the **same** embeddings API call. Two cosine top-k searches run; results are **deduped** so vague questions still surface overview/blog pages.
4. Retrieved chunks are formatted like stuffed pages (title, URL, body) until the **remaining** character budget (after the supplementary block) is exhausted.

If RAG is off, retrieval errors, the table is missing, or no chunks are returned, the route **falls back** to stuffing (below).

### Fallback: character-cap stuffing

1. Load all rows from `content` for the `customerId`.
2. Sort by `created_at`, then `url` (stable, reproducible ordering).
3. **Stuffing:** concatenate each page as a markdown block until a **character budget** is reached (same block shape as RAG excerpts).
4. If the next whole page would exceed the budget, **stop**. That page and any later rows are **omitted** (no partial-page fill).
5. The result is embedded in the **system** prompt. The model is instructed to answer only from that text.

**Implications (fallback only)**

- Questions whose answers live only on pages **after** the cut are more likely to get “I don’t have that in your site content.”
- Order is **not** query-relevant; relevance is left to the model within the stuffed excerpt.

## Limits (server-side)

| Concern | Default | Override (env) | Notes |
|--------|---------|----------------|--------|
| Crawled text in system prompt | 60,000 characters | `CHAT_CONTEXT_MAX_CHARS` | Clamped 8,000–120,000. Applies to **both** RAG-assembled text and stuffing. |
| Recent turns in request | 12 messages | `CHAT_HISTORY_MESSAGES` | Clamped 2–32. User/assistant strings passed through `sanitizeChatMessage` (2,000 chars each, `LIMITS.chatMessage` in `lib/validation.ts`). |
| Completion length | 600 tokens | `CHAT_MAX_TOKENS` | Clamped 128–1200. |
| Requests per minute (per customer) | 30 | `CHAT_RATE_LIMIT_PER_MINUTE` | Clamped 5–120. |
| Use RAG when indexed | on | `CHAT_USE_RAG` | Set to `0` / `false` to force stuffing only. |
| RAG top-k chunks | 8 | `CHAT_RAG_TOP_K` | Clamped 1–24. |
| Chunk size (chars) | 2000 | `CHAT_RAG_CHUNK_CHARS` | Clamped 400–8000. |
| Chunk overlap (chars) | 300 | `CHAT_RAG_CHUNK_OVERLAP` | Clamped 0–2000. |
| Embedding model | `text-embedding-3-small` | `CHAT_RAG_EMBEDDING_MODEL` | Must produce **1536** dims to match `vector(1536)` in the migration. |
| Second RAG query (broad topics) | on (built-in default string) | `CHAT_RAG_AUGMENT_QUERY` | Set to `0` / `false` / `off` to disable second retrieval. Set to custom text (e.g. niche keywords) to tune a tenant vertical. |

Constants and stuffing helpers live in `lib/chat-context.ts`. RAG env helpers: `lib/rag-config.ts`. Supplementary context: `lib/chat-supplementary-context.ts`. Wiring is in `app/api/chat/route.ts`.

## Product / blog data

- **LLM:** Up to 20 rows each from `customer_products` and `customer_blog_posts` are summarized into the supplementary markdown so the model can answer from curated lists.
- **UI cards:** `POST /api/chat/extract-blocks` still returns card payloads for the widget (first 5 each); keep lists aligned if you rely on both.

## Demo chat

`POST /api/chat/demo` reads `data/demo-content.json`, uses a **10**-message history slice, and **`DEMO_CHAT_MAX_TOKENS`** (default 400) for output. It does not use `lib/chat-context.ts` today; keep demo content small.

## Operations

- **Re-index:** Triggered automatically after crawl. If you add content without a crawl, run a rescan or call the same code path.
- **Cost:** Each crawl runs one embedding batch per ~24 chunks; each chat message uses **one** embeddings API call with **one or two** inputs (user query + augment), plus the LLM (same `OPENAI_API_KEY`).
