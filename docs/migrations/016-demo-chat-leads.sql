-- Demo chat leads: contact info captured on /chat/demo before free-form Q&A.
-- Run in Neon SQL Editor (or your Postgres) after prior migrations.

CREATE TABLE IF NOT EXISTS demo_chat_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  email text,
  phone text,
  skipped boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT demo_chat_leads_chk CHECK (
    skipped = true
    OR (
      first_name IS NOT NULL
      AND trim(first_name) <> ''
      AND email IS NOT NULL
      AND trim(email) <> ''
    )
  )
);

CREATE INDEX IF NOT EXISTS demo_chat_leads_created_at_idx ON demo_chat_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS demo_chat_leads_email_idx ON demo_chat_leads (lower(trim(email))) WHERE email IS NOT NULL AND trim(email) <> '';

-- Example: completed lead (normal insert from app after name + email + optional phone)
-- INSERT INTO demo_chat_leads (first_name, email, phone, skipped)
-- VALUES ('Jordan', 'jordan@example.com', '+14075551234', false);

-- Example: user skipped lead capture (still useful for funnel analytics)
-- INSERT INTO demo_chat_leads (first_name, email, phone, skipped)
-- VALUES (NULL, NULL, NULL, true);
