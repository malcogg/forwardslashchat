-- Checkout leads: store form data when user submits (before payment)
-- Run in Neon SQL Editor

CREATE TABLE IF NOT EXISTS checkout_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  business_name text NOT NULL,
  domain text NOT NULL DEFAULT '',
  website_url text NOT NULL DEFAULT '',
  plan_slug text NOT NULL,
  add_ons jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_cents integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
