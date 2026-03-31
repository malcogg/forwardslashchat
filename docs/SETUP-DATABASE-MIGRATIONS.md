# Database Setup & Migrations

## Run migrations in Neon

1. Go to [Neon Console](https://console.neon.tech) → your project → **SQL Editor**
2. Run in order:

### 1. Initial tables (if not already done)
```sql
-- See docs/init-tables.sql for full schema
```

### 2. Credits migration
```sql
-- Add Firecrawl credit tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS firecrawl_plan text DEFAULT 'free';

CREATE TABLE IF NOT EXISTS credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_used integer NOT NULL DEFAULT 0,
  period_start timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz;
```

Or run the full file: `docs/migrations/001-credits.sql`
