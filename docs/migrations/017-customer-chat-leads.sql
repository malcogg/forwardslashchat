-- Visitor leads from paid customer chat widgets (/chat/c/[customerId]).
-- Run in Neon (or Postgres) after prior migrations. Then `npm run db:push` if using Drizzle push for local dev.

CREATE TABLE IF NOT EXISTS customer_chat_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  first_name text,
  email text,
  phone text,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_chat_leads_chk CHECK (
    skipped = true
    OR (
      first_name IS NOT NULL
      AND trim(first_name) <> ''
      AND email IS NOT NULL
      AND trim(email) <> ''
    )
  )
);

CREATE INDEX IF NOT EXISTS customer_chat_leads_customer_id_idx ON customer_chat_leads (customer_id);
CREATE INDEX IF NOT EXISTS customer_chat_leads_created_at_idx ON customer_chat_leads (created_at DESC);
