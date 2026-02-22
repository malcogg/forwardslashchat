# Stripe Integration — What You Need

Your checkout page now uses **Stripe's prebuilt Checkout** instead of PayPal. Here’s what to configure.

---

## 1. Environment variables

Add these to **Vercel** (Project → Settings → Environment Variables) and to `.env.local` for local dev:

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks (see step 2) |

- **Test mode**: use `sk_test_...` (and the test webhook secret).
- **Live mode**: use `sk_live_...` (and the live webhook secret) when you go live.

---

## 2. Webhook endpoint (required)

Stripe must call your app when payment completes so orders can be marked as paid.

1. Go to **Stripe Dashboard** → Developers → Webhooks → Add endpoint.
2. **Endpoint URL**:  
   - Production: `https://forwardslash.chat/api/webhooks/stripe`  
   - Local: use Stripe CLI (see step 3).
3. **Events to send**: select `checkout.session.completed`.
4. Click **Add endpoint**.
5. Open the new webhook, click **Reveal** under Signing secret, and copy it.
6. Add that value as `STRIPE_WEBHOOK_SECRET` in Vercel and `.env.local`.

---

## 3. Local testing (optional)

To test payments locally:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Stripe will show a webhook signing secret (starts with `whsec_`). Use that as `STRIPE_WEBHOOK_SECRET` for local testing. Do not use it in production.

---

## 4. Flow overview

1. User fills checkout form and clicks **Pay — Secure checkout**.
2. App creates a checkout lead, order, and customer record.
3. User is redirected to Stripe’s hosted Checkout page.
4. User pays with a card on Stripe.
5. Stripe redirects to `/thank-you?orderId=...`.
6. Stripe sends `checkout.session.completed` to your webhook.
7. Webhook marks the order as paid in your database.

---

## 5. Quick checklist

- [ ] Add `STRIPE_SECRET_KEY` to Vercel (and `.env.local` for dev).
- [ ] Create webhook in Stripe with URL `https://forwardslash.chat/api/webhooks/stripe`.
- [ ] Add `STRIPE_WEBHOOK_SECRET` from the webhook to Vercel.
- [ ] Redeploy (Vercel auto-deploys when env vars change, or trigger a deploy).
- [ ] Run a test payment in Stripe test mode to confirm the flow.
