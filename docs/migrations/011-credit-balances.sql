-- 011-credit-balances.sql
-- Purchased rescan credits ledger.

CREATE TABLE IF NOT EXISTS credit_balances (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  delta integer NOT NULL,
  reason text NOT NULL,
  stripe_session_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id, created_at DESC);

