# Resend Receiving — hello@forwardslash.chat

> Receive inbound emails at the same address you send from: **hello@forwardslash.chat**

*Last updated: February 2026*

Based on [Resend Receiving docs](https://resend.com/docs/dashboard/receiving/introduction).

---

## 1. Enable receiving on your domain (Resend Dashboard)

1. Go to [Resend Domains](https://resend.com/domains).
2. Open **forwardslash.chat** (the domain you already use for sending).
3. Find the **Receiving** section and turn it **ON** (or add receiving if it's a new setup).
4. Resend will show an **MX record** — copy it. Example:
   ```
   Type: MX
   Host: @ (or forwardslash.chat)
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```
   *(Exact values come from your Resend dashboard.)*

---

## 2. Add MX record in your DNS

**If forwardslash.chat has NO existing MX records** (no other email provider):

1. In your DNS provider (Cloudflare, GoDaddy, etc.), add the MX record from Resend.
2. Use the **Host** and **Value** Resend gives you.
3. Set **Priority** as shown (often `10`).

**If forwardslash.chat already has MX records** (e.g. Google Workspace):

- Avoid changing the root domain MX.
- Use a subdomain instead, e.g. **inbound.forwardslash.chat**:
  1. In Resend, add a **new** domain: `inbound.forwardslash.chat`.
  2. Verify it and enable receiving for that domain.
  3. Add the MX record for `inbound.forwardslash.chat` in DNS.
  4. Then receiving addresses are `hello@inbound.forwardslash.chat`, etc.

  Or configure forwarding in your existing provider to Resend (see Resend’s [custom domains FAQ](https://resend.com/docs/dashboard/receiving/custom-domains)).

---

## 3. Create webhook in Resend

1. Go to [Resend Webhooks](https://resend.com/webhooks).
2. Click **Add Webhook**.
3. **Endpoint URL:** `https://forwardslash.chat/api/webhooks/resend`
4. **Event:** `email.received`
5. Click **Add**.
6. Copy the **Signing secret** and add it to your env as `RESEND_WEBHOOK_SECRET`.

---

## 4. Add env var

In **Vercel** and **.env.local**:

```
RESEND_WEBHOOK_SECRET=whsec_...
```

Get the value from the webhook’s details page in Resend.

---

## 5. Install dependency and deploy

```bash
npm install
```

`svix` is used for webhook verification. Then deploy to Vercel.

---

## 6. Confirm it’s working

1. In Resend Dashboard → [Receiving](https://resend.com/emails/receiving), confirm MX is verified.
2. Send a test email to **hello@forwardslash.chat** (or your subdomain address).
3. In your app logs (Vercel), you should see: `[resend] Email received: { from, to, subject, email_id }`.

---

## What happens when an email is received

- Resend sends a `POST` to `/api/webhooks/resend` with an `email.received` event.
- The webhook checks the Svix signature and logs the event.
- To get the full body/attachments, use the [Resend API](https://resend.com/docs/api-reference/emails/retrieve-received-email) with the `email_id` from the webhook payload.
