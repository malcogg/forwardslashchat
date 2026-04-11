-- P2 RAG: pgvector-backed chunks for customer chat retrieval (see docs/CHAT-CONTEXT.md, TODO.md §6).
-- Apply on Neon (or any Postgres with pgvector). Requires CREATE privilege on the database for the extension.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS content_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  url text NOT NULL,
  title text,
  body text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS content_chunks_customer_id_idx ON content_chunks (customer_id);

-- Cosine distance for ORDER BY embedding <=> query_embedding.
-- If HNSW fails (older Postgres), replace with e.g. IVFFlat after data exists:
--   CREATE INDEX ... ON content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS content_chunks_embedding_hnsw_idx
  ON content_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
