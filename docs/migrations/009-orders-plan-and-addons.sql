-- Add plan_slug and add_ons to orders (for website services + chatbot)
-- Required for post-payment dashboard flow (website orders).
-- plan_slug: starter | new-build | redesign | chatbot-1y | chatbot-2y
-- add_ons: array of add-on IDs (dns, social-media, etc.)
-- Make bundle_years nullable for website orders (use 0 as sentinel where needed)
-- Run in Neon SQL Editor

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS plan_slug text,
  ADD COLUMN IF NOT EXISTS add_ons jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill existing orders: assume chatbot-2y if plan_slug is null
UPDATE orders SET plan_slug = 'chatbot-2y' WHERE plan_slug IS NULL;

-- Make plan_slug NOT NULL for new orders (keep nullable for backward compat if desired)
-- ALTER TABLE orders ALTER COLUMN plan_slug SET NOT NULL;
