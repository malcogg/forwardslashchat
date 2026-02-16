-- ForwardSlash.Chat - Initial schema for Neon
-- Run this once in Neon Console: SQL Editor → paste → Run
-- Or: psql $DATABASE_URL -f docs/init-tables.sql

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "external_id" text UNIQUE,
  "email" text NOT NULL,
  "name" text,
  "firecrawl_plan" text DEFAULT 'free',
  "created_at" timestamptz DEFAULT now() NOT NULL
);

-- If users table already exists without firecrawl_plan, run: ALTER TABLE users ADD COLUMN IF NOT EXISTS firecrawl_plan text DEFAULT 'free';

CREATE TABLE IF NOT EXISTS "scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "url" text NOT NULL,
  "page_count" integer NOT NULL,
  "categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "raw_data" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "scan_id" uuid REFERENCES "scans"("id"),
  "amount_cents" integer NOT NULL,
  "bundle_years" integer NOT NULL,
  "dns_help" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "payment_provider" text,
  "payment_id" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid REFERENCES "orders"("id") NOT NULL,
  "business_name" text NOT NULL,
  "domain" text NOT NULL,
  "subdomain" text DEFAULT 'chat' NOT NULL,
  "website_url" text NOT NULL,
  "primary_color" text DEFAULT '#000000',
  "logo_url" text,
  "welcome_message" text,
  "prepaid_until" timestamptz,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "content" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid REFERENCES "customers"("id") NOT NULL,
  "url" text NOT NULL,
  "title" text,
  "content" text NOT NULL,
  "description" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
