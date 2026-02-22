# Vercel Domain Automation — Your Setup Instructions

This guide walks you through getting the credentials needed so the app can **automatically add customer domains** (e.g. `chat.theirdomain.com`) to your Vercel project via the API.

---

## What You’ll Do (Once)

1. Create a Vercel Access Token  
2. Copy your Project ID  
3. Add both as environment variables  
4. (Optional) Confirm your CNAME target  

After this, when a customer clicks **"Go live"** in the dashboard, the app will:

1. Check that their CNAME points to your target  
2. Add their domain to Vercel via the API  
3. Let Vercel provision SSL and serve traffic

---

## Step 1: Create a Vercel Access Token

1. Go to **[vercel.com/account/tokens](https://vercel.com/account/tokens)**  
   - Or: Vercel Dashboard → Profile (bottom-left) → **Settings** → **Access Tokens**
2. Click **Create Token**
3. **Token name:** `ForwardSlash Domain Automation` (or similar)
4. **Scope:** Full Account (or limit to your team)
5. **Expiration:** No expiration (or set one)
6. Click **Create**
7. **Copy the token immediately** — it won’t be shown again

---

## Step 2: Get Your Project ID

1. Vercel Dashboard → select your **ForwardSlash** project  
2. Open **Settings** → **General**
3. Find **Project ID** (e.g. `prj_xxxxxxxxxxxx`)

You can also copy it from the project URL: `https://vercel.com/your-team/forwardslash` (check the Project Settings for the exact ID).

---

## Step 3: Add Environment Variables

1. Vercel Dashboard → your project → **Settings** → **Environment Variables**
2. Add:

| Name | Value | Environment |
|------|-------|-------------|
| `VERCEL_ACCESS_TOKEN` | The token from Step 1 | Production (and Preview if needed) |
| `VERCEL_PROJECT_ID` | The project ID from Step 2 | Production (and Preview if needed) |

3. Save

---

## Step 4 (Optional): CNAME Target

Customers are told to point their subdomain (e.g. `chat.theirdomain.com`) to your CNAME target.

- **Default:** `cname.vercel-dns.com` (Vercel’s standard target). No extra env or DNS.
- **Branded:** To use `cname.forwardslash.chat`:
  1. Add `CNAME_TARGET=cname.forwardslash.chat` to env vars.
  2. In your DNS: add `cname.forwardslash.chat` → CNAME → `cname.vercel-dns.com`.

---

## Checklist

- [ ] Vercel Access Token created and copied  
- [ ] Project ID copied  
- [ ] `VERCEL_ACCESS_TOKEN` added to Vercel env vars  
- [ ] `VERCEL_PROJECT_ID` added to Vercel env vars  
- [ ] Redeployed so the app picks up the new env vars  

---

## After Setup

When a customer:

1. Adds the CNAME at their DNS provider  
2. Clicks **"Go live"** in the dashboard  

the app will verify the CNAME and add their domain to Vercel via the API. No manual step in the Vercel UI is required.
