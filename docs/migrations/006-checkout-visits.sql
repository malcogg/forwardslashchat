-- Checkout visits: track signed-in users who view /checkout (for abandonment reminder)
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS checkout_visits (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  visited_at timestamptz DEFAULT now() NOT NULL
);
