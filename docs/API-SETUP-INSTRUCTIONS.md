# API Setup Instructions – Multi-Tenant Automation

Step-by-step instructions to get the API keys and config you need for DNS verification and Vercel domain automation.

---

## 1. DNS Verification (DoH – No API Key)

DNS-over-HTTPS lets us check CNAME records server-side. **No signup or API key required** for the public endpoints below.

### Option A: Google DoH (recommended)
- **Endpoint:** `https://dns.google/resolve`
- **Example:** `https://dns.google/resolve?name=chat.business.com&type=CNAME`
- **Auth:** None
- **Docs:** [Google DNS-over-HTTPS](https://developers.google.com/speed/public-dns/docs/doh/json)

### Option B: Cloudflare DoH
- **Endpoint:** `https://cloudflare-dns.com/dns-query`
- **Example:** `https://cloudflare-dns.com/dns-query?name=chat.business.com&type=CNAME`
- **Headers:** `Accept: application/dns-json`
- **Auth:** None
- **Docs:** [Cloudflare DNS over HTTPS](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/)

**What you need:** Nothing. The DoH endpoint is public; we'll call it from our API route.

---

## 2. Vercel API (Domain + Project Management)

Used to add custom domains (`chat.business.com`) to your Vercel project.

### Get a Vercel Access Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your profile (bottom-left) → **Settings**
3. **Access Tokens** (or go to [vercel.com/account/tokens](https://vercel.com/account/tokens))
4. **Create Token**
5. **Token name:** e.g. `ForwardSlash Domain Automation`
6. **Scope:** Full Account (or limit to the correct team)
7. **Expiration:** No expiration (or set one)
8. **Create** → copy the token immediately (it won’t show again)

### What you’ll set in env

| Env var | Value | Where |
|---------|-------|-------|
| `VERCEL_ACCESS_TOKEN` | The token above | Vercel Project → Settings → Environment Variables |
| `VERCEL_PROJECT_ID` | Your project ID (see below) | Same |

### Get your Project ID

1. Vercel Dashboard → select the **ForwardSlash** project
2. **Settings** → **General**
3. **Project ID** is listed (e.g. `prj_xxxxxxxxxxxx`)

Or from the project URL: `https://vercel.com/your-team/forwardslash` → the project ID is in the API/URLs.

### Vercel API reference

- **Add domain:**  
  `POST https://api.vercel.com/v10/projects/{projectId}/domains`  
  Body: `{ "name": "chat.business.com" }`  
  Headers: `Authorization: Bearer {VERCEL_ACCESS_TOKEN}`

- **Docs:** [Vercel REST API – Domains](https://vercel.com/docs/rest-api/endpoints#domains)

---

## 3. Your CNAME target

Customers point their subdomain to your Vercel deployment.

1. Vercel → Project → **Settings** → **Domains**
2. Add a placeholder or check existing setup
3. Note the **CNAME target** (often `cname.vercel-dns.com` for Vercel, or a custom like `cname.forwardslash.chat` if you use one)

**Use this value in the app** so we check that `chat.business.com` CNAME points to the correct target.

---

## 4. Checklist before implementation

| Item | Status |
|------|--------|
| DoH endpoint chosen (Google or Cloudflare) | No key needed |
| `VERCEL_ACCESS_TOKEN` created | Add to Vercel env vars |
| `VERCEL_PROJECT_ID` copied | Add to Vercel env vars |
| CNAME target confirmed (e.g. `cname.vercel-dns.com`) | Use in DNS verify logic |

---

## 5. Env vars summary

Add these to **Vercel** → Project → Settings → Environment Variables (Production):

```
VERCEL_ACCESS_TOKEN=xxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxx
# Optional: if using custom CNAME target
# CNAME_TARGET=cname.forwardslash.chat
```

`CNAME_TARGET` can default to `cname.vercel-dns.com` when not set if that’s your Vercel target.
