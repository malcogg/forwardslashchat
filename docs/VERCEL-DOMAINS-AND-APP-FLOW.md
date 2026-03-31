# Vercel Domains & App Flow

**Last updated:** February 2026

---

## 1. Vercel — Making Domains Go Live

### Production domain (forwardslash.chat)

1. **Add your domain**
   - Vercel Dashboard → Your Project → **Settings** → **Domains**
   - Add: `forwardslash.chat` and `www.forwardslash.chat` (if desired)

2. **Configure DNS**
   - Vercel will show the records to add.
   - At your registrar (GoDaddy, Namecheap, Cloudflare, etc.):
     - **Apex (forwardslash.chat):** A record → `76.76.21.21`
     - **WWW (www.forwardslash.chat):** CNAME → `cname.vercel-dns.com`

3. **Production branch**
   - Settings → **Git** → set **Production Branch** (usually `main` or `landing-page`)
   - Merges/deploys to this branch become the **production** deployment
   - Your custom domain points to the latest production deployment

4. **Environment variables**
   - Ensure production env vars are set for **Production** (and Preview if needed):
     - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
     - `NEXT_PUBLIC_APP_URL=https://forwardslash.chat`
     - Clerk, Resend, database, etc.

---

## 2. Preview URLs — What You Get by Default

- **Every push/PR** creates a **preview deployment**
- **Default URL:** `your-project-abc123-your-team.vercel.app`
- Preview URLs are random-looking and not branded

---

## 3. Masking Preview Links (Preview Deployment Suffix)

You want previews to use your domain instead of `vercel.app`, e.g.:

- `preview-abc123.forwardslash.chat` or
- `staging-xyz.forwardslash.chat`

Use **Preview Deployment Suffix**:

1. **Requirements**
   - **Pro plan or Enterprise** (add-on on Pro)
   - Domain using **Vercel Nameservers** OR a wildcard CNAME

2. **Setup**
   - Team Dashboard → **Settings** → **Billing** → **Add-Ons**
   - Enable **Preview Deployment Suffix**
   - Enter a custom suffix domain, e.g. `preview.forwardslash.chat`

3. **DNS**
   - Add `*.preview.forwardslash.chat` (or your chosen subdomain) as a CNAME to `cname.vercel-dns.com` at your registrar
   - Or use Vercel Nameservers for the root domain

4. **Result**
   - Preview URLs change from `project-xyz.vercel.app` → `project-xyz.preview.forwardslash.chat`

**Note:** “Business name” in preview URLs (e.g. `acme-preview.forwardslash.chat`) is not a standard Vercel feature. Preview Deployment Suffix gives you `deployment-id.preview.forwardslash.chat`. To get per-business preview URLs (like `acme.forwardslash.chat`) you’d need custom logic (e.g. branch naming or internal routing).

---

## 4. App Flow (Current — Stripe Checkout)

### Path A: Anonymous visitor → Roast → Pay (no account yet)

1. **Homepage** → Enter URL → **Scan modal** opens
2. **Roasting** → Light scan, roast result + estimated pages
3. **Roast results** → “Pay $X” or “Contact us” (500+ pages) → links to checkout
4. **Checkout** → Form: name, email, phone, business, domain, website
5. **Pay** → `POST /api/checkout/stripe`:
   - Creates lead, order, customer
   - Returns Stripe Checkout URL
   - Redirects to **Stripe Checkout** (card payment)
6. **Stripe** → User pays
7. **Webhook** → Stripe calls `POST /api/webhooks/stripe` → order marked `paid`
8. **Thank-you page** → ` /thank-you?orderId=...` — “Create account” or “Sign in”
9. **Account** → Sign up / sign in → redirect to ` /dashboard?orderId=...`

### Path B: Visitor → Sign up first → Dashboard → Pay later

1. Roast results → “Create free account” → Clerk sign-up
2. **Dashboard** → Pending order; status “Payment pending”
3. **Checkout** (from dashboard or pricing) → Pay with Stripe → same flow as Path A

### Path C: Paid user → Build chatbot → Go live

1. **Dashboard** with paid order → status: Payment confirmed, Content & training, DNS setup, Chatbot live
2. **Build my chatbot** → Triggers crawl (Firecrawl) → Content saved
3. **Emails** → “Your chatbot content is ready” + “Add this CNAME to go live”
4. **DNS** → Customer adds CNAME (`chat` → `cname.forwardslash.chat`) in their DNS
5. **Chat preview** → ` /chat/c/[customerId]` on forwardslash.chat
6. **Go live** → Domain added in Vercel (manual today) → chatbot at `chat.theirdomain.com`

---

## 5. What the User Sees — End-to-End

| Step | User experience |
|------|------------------|
| **1. Land on site** | Homepage at forwardslash.chat |
| **2. Scan** | Enter URL → roast result in a few seconds |
| **3. Checkout** | Plan + form; click “Pay $X — Secure checkout” |
| **4. Payment** | Stripe hosted page; enter card and pay |
| **5. Thank-you** | “Thanks for your order!” → Create account / Sign in |
| **6. Dashboard** | See order status and project |
| **7. Build** | Click “Build my chatbot” → crawl runs (2–8 min) |
| **8. Emails** | “Content ready” + DNS instructions |
| **9. DNS** | Add CNAME in their DNS provider |
| **10. Live** | Chatbot at `chat.theirdomain.com` |

### After everything is done

- **Dashboard:** Order status = delivered; “Try your chatbot” link
- **Chat:** `chat.theirdomain.com` (or `forwardslash.chat/chat/c/[id]`) answers questions from their site
- **Emails:** Welcome, payment confirmed, content ready, DNS instructions, build reminder (if they pause)

---

## 6. Quick checklist — Vercel domains live

- [ ] Domain added in Vercel (Settings → Domains)
- [ ] DNS configured (A / CNAME at registrar)
- [ ] Production branch set
- [ ] `NEXT_PUBLIC_APP_URL=https://forwardslash.chat` in Production env
- [ ] Stripe webhook URL uses production domain: `https://forwardslash.chat/api/webhooks/stripe`
- [ ] (Optional) Preview Deployment Suffix for branded preview URLs
