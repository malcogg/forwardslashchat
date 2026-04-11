-- 013: Stripe reconciliation columns on orders + webhook idempotency table
-- Fixes: column "stripe_checkout_session_id" does not exist (dashboard / API select full order row)
-- Run in Neon: SQL Editor → paste → Run

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE TABLE IF NOT EXISTS stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  type text NOT NULL,
  order_id uuid REFERENCES orders (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_order_id_idx ON stripe_events (order_id);
