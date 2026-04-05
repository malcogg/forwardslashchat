-- Persist in-flight crawl state for dashboard (Firecrawl job id, phase, elapsed).
-- Run in Neon SQL Editor

ALTER TABLE customers ADD COLUMN IF NOT EXISTS crawl_progress jsonb;
