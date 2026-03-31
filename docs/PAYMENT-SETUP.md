# Payment Setup (Stripe + PayPal)

## Stripe

1. Sign up at [stripe.com](https://stripe.com)
2. Get keys: Dashboard → Developers → API keys
   - Add `STRIPE_SECRET_KEY` (sk_test_... for test mode)
   - Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` if using Stripe Elements (optional for Checkout)
3. Webhook: Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`
4. For local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## PayPal

PayPal integration is planned. Structure will mirror Stripe: create order, redirect to PayPal, webhook for confirmation.

## Checkout Flow

- **Test mode**: "Create order (test mode)" — no payment, creates order in DB, goes to dashboard
- **Stripe**: "Pay with Stripe" — creates order, redirects to Stripe Checkout, webhook marks paid on success
