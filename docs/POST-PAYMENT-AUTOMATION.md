# Post-payment automation (manual mark-paid in Neon)

You mark an order as **paid** in Neon (Tables → orders → set `status` to `paid`). From that moment, the app handles the rest with no further manual steps.

## What was implemented

### 1. Cron: paid notification + build reminder

- **Route:** `GET /api/cron/paid-notification`
- **Schedule:** Every 10 minutes (Vercel cron `*/10 * * * *`)
- **Auth:** `Authorization: Bearer CRON_SECRET` (same as other crons)

**Step 1 – Newly paid**

- Finds orders where `status = 'paid'` and `paid_notification_sent_at IS NULL`.
- Sends one email per order: **"Payment confirmed – build your chatbot"** (dashboard link, "Build my chatbot" CTA).
- Sets `orders.paid_notification_sent_at = NOW()` so we never send twice.

**Step 2 – Build reminder (optional)**

- Finds orders where:
  - `status = 'paid'`
  - `paid_notification_sent_at` was set more than 2 days ago
  - `build_reminder_sent_at IS NULL`
  - Customer has no rows in `content` (they haven’t clicked Build yet).
- Sends **"Build your bot to get started"**.
- Sets `orders.build_reminder_sent_at = NOW()`.

### 2. Database (migration 008)

- **`orders.paid_notification_sent_at`** (timestamptz, nullable) – when the “Payment confirmed – build your chatbot” email was sent.
- **`orders.build_reminder_sent_at`** (timestamptz, nullable) – when the “Build your bot” reminder was sent.

Run: `docs/migrations/008-paid-notification-sent.sql` in Neon.

### 3. Dashboard polling

- When the current order’s `status` is not `paid`, the dashboard refetches `/api/dashboard` (and `/api/orders/me`) every **30 seconds**.
- As soon as you set `status = 'paid'` in Neon, the user sees the order as paid within 30s (or on next refresh).

### 4. Crawl success email

- After a successful crawl, the existing “Your chatbot content is ready” email now includes a **“Try your chatbot”** link to `https://forwardslash.chat/chat/c/[customerId]` (or `NEXT_PUBLIC_APP_URL`).

### 5. No new admin or webhooks

- No PayPal webhook, no public admin “mark paid” endpoint. You keep marking paid only in Neon.

## Flow summary

1. Customer pays via PayPal.me → you get notified.
2. You set `orders.status = 'paid'` in Neon.
3. Within ~10 minutes, cron sends “Payment confirmed – build your chatbot” (once per order).
4. Dashboard polls every 30s; user sees “paid” and can click **Build my chatbot**.
5. User clicks Build → `POST /api/customers/[id]/crawl` runs (existing logic: Firecrawl, content, status, emails).
6. After crawl, user gets “Your chatbot content is ready” + “Add this CNAME” + link to try the chat.
7. If they still haven’t built 2+ days after the first email, they get one “Build your bot to get started” reminder.

## Vercel

- Cron is in `vercel.json`: `"/api/cron/paid-notification"` with schedule `*/10 * * * *`.
- Ensure `CRON_SECRET` is set in Vercel so the cron is authorized.
