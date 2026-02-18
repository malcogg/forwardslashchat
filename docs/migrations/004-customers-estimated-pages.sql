-- Add estimated_pages to customers (from roast; used for pricing before crawl)
-- Run in Neon SQL Editor

ALTER TABLE customers ADD COLUMN IF NOT EXISTS estimated_pages integer;
