-- User onboarding answers (post-auth, pre-dashboard). Run in Neon SQL Editor.
-- Application uses INSERT ... ON CONFLICT (user_id) DO UPDATE (upsert), not one-time seed rows.

CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  path text NOT NULL CHECK (path IN ('has_website', 'no_website')),
  referral_source text,
  has_existing_ai_chat boolean,
  industry text,
  dns_help_preference text,
  assistant_primary_use text,
  website_url_snapshot text,
  no_site_project_note text,
  no_site_timeline text,
  skipped_step_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed_at ON user_onboarding (completed_at);

COMMENT ON TABLE user_onboarding IS 'Pre-dashboard questionnaire; path branches has_website vs no_website.';
COMMENT ON COLUMN user_onboarding.path IS 'has_website: chatbot scan path; no_website: website upsell path';
COMMENT ON COLUMN user_onboarding.dns_help_preference IS 'self | guided | someone_else';
COMMENT ON COLUMN user_onboarding.skipped_step_ids IS 'JSON array of step ids user skipped';
COMMENT ON COLUMN user_onboarding.extra IS 'Future-proof key/value for A/B questions';

-- Example: upsert after user completes onboarding (replace UUIDs and values)
-- INSERT INTO user_onboarding (
--   user_id, path, referral_source, has_existing_ai_chat, industry,
--   dns_help_preference, assistant_primary_use, website_url_snapshot,
--   no_site_project_note, no_site_timeline, skipped_step_ids, extra, completed_at, updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'has_website',
--   'search',
--   false,
--   'Professional services',
--   'guided',
--   'leads',
--   'https://example.com',
--   NULL,
--   NULL,
--   '["referral","industry"]'::jsonb,
--   '{}'::jsonb,
--   now(),
--   now()
-- )
-- ON CONFLICT (user_id) DO UPDATE SET
--   path = EXCLUDED.path,
--   referral_source = EXCLUDED.referral_source,
--   has_existing_ai_chat = EXCLUDED.has_existing_ai_chat,
--   industry = EXCLUDED.industry,
--   dns_help_preference = EXCLUDED.dns_help_preference,
--   assistant_primary_use = EXCLUDED.assistant_primary_use,
--   website_url_snapshot = EXCLUDED.website_url_snapshot,
--   no_site_project_note = EXCLUDED.no_site_project_note,
--   no_site_timeline = EXCLUDED.no_site_timeline,
--   skipped_step_ids = EXCLUDED.skipped_step_ids,
--   extra = EXCLUDED.extra,
--   completed_at = EXCLUDED.completed_at,
--   updated_at = now();
