-- Paid notification tracking (no webhook: you mark paid in Neon; cron sends "build your chatbot" email once)
-- Optional: build_reminder_sent_at for "paid > 2 days, no content yet" reminder

ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_notification_sent_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS build_reminder_sent_at timestamptz;

COMMENT ON COLUMN orders.paid_notification_sent_at IS 'When we sent "Payment confirmed – build your chatbot" (cron)';
COMMENT ON COLUMN orders.build_reminder_sent_at IS 'When we sent "Build your bot to get started" reminder (paid 2+ days, no content)';
