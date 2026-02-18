-- Block fake email users (unknown@example.com)
-- These are signups that bypassed our flow (email-less Clerk auth) to reach the dashboard.
-- Run in Neon SQL Editor.
--
-- App-level fix (lib/auth.ts): getOrCreateUser() now rejects unknown@example.com - blocked at API level.
-- This migration: audit and optionally remove existing fake users from the database.

-- 1. AUDIT: List fake users (run first to see what you're removing)
SELECT id, external_id, email, name, created_at
FROM users
WHERE email = 'unknown@example.com';

-- 2. CLEANUP: Remove fake users and their dependencies
-- Orders: set user_id to NULL (orphan the order; it stays as pending/unpaid)
UPDATE orders
SET user_id = NULL
WHERE user_id IN (SELECT id FROM users WHERE email = 'unknown@example.com');

-- Credit usage: delete (1:1 with user)
DELETE FROM credit_usage
WHERE user_id IN (SELECT id FROM users WHERE email = 'unknown@example.com');

-- Users: remove fake accounts
DELETE FROM users
WHERE email = 'unknown@example.com';

-- 3. OPTIONAL: Prevent future inserts at DB level (defense in depth)
-- Only add if you've run the cleanup above and confirmed no rows remain.
-- ALTER TABLE users ADD CONSTRAINT users_email_not_placeholder
--   CHECK (email IS NULL OR email != 'unknown@example.com');
