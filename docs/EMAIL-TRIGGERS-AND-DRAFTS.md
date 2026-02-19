# Email Triggers & Drafts

> Minimal subject + body for each trigger.

---

## Current (Live)

| Trigger | Subject | Status |
|---------|---------|--------|
| Clerk `user.created` | Welcome to ForwardSlash.Chat | ✅ |
| Cron: users 2+ days, no paid order | Still want your AI chatbot? | ✅ |
| Crawl completes | Your chatbot content is ready | ✅ Auto |
| Crawl completes | Add this CNAME to go live | ✅ Auto |
| Cron: checkout visit 4–24h ago, no paid order | Finish your AI chatbot order | ✅ Auto |

---

## Manual (You Send)

### 1. Order confirmation (PayPal)
**Trigger:** After you mark an order paid in admin  
**Recipient:** Customer email (from checkout lead or user)

| | |
|---|---|
| **Subject** | Thanks for your order — {businessName} |
| **Body** | We received your payment. Check your dashboard at forwardslash.chat/dashboard for next steps. Questions? Reply here. |

**API:** `POST /api/email` with `Authorization: Bearer EMAIL_API_SECRET`  
```json
{
  "type": "order-confirmation",
  "to": "customer@example.com",
  "businessName": "Acme Co",
  "planName": "AI Chatbot (2-year)",
  "total": "$850"
}
```

---

### 2. Chatbot delivered
**Trigger:** When you mark chatbot live (or customer clicks "Chatbot is live")  
**Recipient:** Order owner

| | |
|---|---|
| **Subject** | Your chatbot is live |
| **Body** | Your chatbot for {businessName} is live. Share it with your customers. [Test your chatbot →](https://{subdomain}.{domain}) Questions? Reply here. |

**API:** `POST /api/email` with `Authorization: Bearer EMAIL_API_SECRET`  
```json
{
  "type": "chatbot-delivered",
  "to": "customer@example.com",
  "firstName": "Jane",
  "businessName": "Acme Co",
  "chatUrl": "https://chat.example.com"
}
```

---

## Implemented

### Crawl complete
- **Subject:** Your chatbot content is ready
- **Stats:** Pages crawled, website URL, chatbot URL
- **Body:** CNAME block + CTA to dashboard + upsell ("Got more sites? Add them...")
- **Trigger:** When `POST /api/customers/[id]/crawl` succeeds

### DNS instructions
- **Subject:** Add this CNAME to go live
- **Body:** CNAME block + Cloudflare/GoDaddy links + CTA to dashboard
- **Trigger:** Same as crawl complete (sent right after)

### Checkout abandonment
- **Subject:** Finish your AI chatbot order
- **Body:** You visited checkout — one payment away. CTA to complete.
- **Trigger:** Cron (daily 3pm UTC). Users who viewed /checkout 4–24h ago, no paid order.
- **Tracking:** Signed-in users only. `POST /api/checkout/visit` when they land on checkout. Run migration `006-checkout-visits.sql`.

---

## Notes

- Order confirmation: Use PayPal flow; send manually via `/api/email` or copy/paste when you mark paid.
- All: FROM_EMAIL = hello@forwardslash.chat. Reply-to = hello@forwardslash.chat.
