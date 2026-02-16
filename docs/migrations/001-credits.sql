-- Add Firecrawl credit tracking. Run after init-tables.sql

-- Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS firecrawl_plan text DEFAULT 'free';

-- Credit usage per user
CREATE TABLE IF NOT EXISTS credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_used integer NOT NULL DEFAULT 0,
  period_start timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- When we last crawled each customer's site
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz;
