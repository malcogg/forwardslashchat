-- Track which payment reminder emails we've sent (avoid duplicate sends, enable sequence)
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS reminder_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  reminder_type text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, reminder_type)
);
