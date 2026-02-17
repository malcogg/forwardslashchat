# Clerk Webhook Troubleshooting

If the welcome email isn't sending after signup (Google or email/password):

## 1. Verify Clerk webhook is configured

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **Webhooks**
2. Check you have an endpoint for `https://forwardslash.chat/api/webhooks/clerk`
3. **Subscribe to events** must include `user.created`
4. Copy the **Signing Secret** (click the eye icon)

## 2. Verify environment variables (Vercel)

In Vercel → Project → Settings → Environment Variables, ensure:

- `CLERK_WEBHOOK_SIGNING_SECRET` = the signing secret from step 1
- `RESEND_API_KEY` = your Resend API key
- `RESEND_FROM_EMAIL` = `ForwardSlash.Chat <hello@forwardslash.chat>`

**Critical:** `CLERK_WEBHOOK_SIGNING_SECRET` is different from `CLERK_SECRET_KEY`. You get it from the Webhook endpoint settings, not the API Keys page.

## 3. Check webhook delivery in Clerk

1. Clerk Dashboard → Webhooks → your endpoint
2. Open **Recent deliveries** or **Logs**
3. After signing up with Google, you should see a `user.created` event
4. If **Failed**: click to see the error (often 400 = wrong signing secret, 500 = Resend/our code error)
5. If **Succeeded**: webhook ran; check Resend dashboard for the email

## 4. Development vs production

- Production: webhook URL must be `https://forwardslash.chat/api/webhooks/clerk`
- If testing locally: use [ngrok](https://ngrok.com) to expose localhost and point Clerk to the ngrok URL

## 5. Resend

- Check [Resend dashboard](https://resend.com/emails) for delivery status
- If the domain isn't verified, emails may fail or go to spam
