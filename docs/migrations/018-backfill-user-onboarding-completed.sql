-- One-time: mark existing users as onboarding-complete so they are not sent to /onboarding.
-- Run in Neon (or your Postgres) after deploying the full-page onboarding flow.

INSERT INTO user_onboarding (
  user_id,
  path,
  skipped_step_ids,
  extra,
  completed_at,
  updated_at
)
SELECT
  u.id,
  'has_website',
  '[]'::jsonb,
  '{}'::jsonb,
  now(),
  now()
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_onboarding o WHERE o.user_id = u.id);
