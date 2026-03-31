-- 012-chat-rate-limits.sql
-- Per-customer (or per-IP) per-minute counters to prevent abuse / runaway OpenAI spend.

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_rate_limits_key_window_idx
  ON chat_rate_limits(key, window_start);

