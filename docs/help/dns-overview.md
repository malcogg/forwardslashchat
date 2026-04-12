# DNS overview: point `chat.` at ForwardSlash

This page explains **what** you’re changing and **why** your main website can break if DNS is edited wrong.

## What you need

| Item | Example |
|------|---------|
| **Subdomain for chat** | `chat.yourdomain.com` |
| **Record type** | **CNAME** |
| **Target (value)** | Usually **`cname.vercel-dns.com`** — use the exact value from your ForwardSlash dashboard or go-live instructions (some projects use a custom CNAME target). |

You do **not** change where **`yourdomain.com`** (the apex) or **`www`** points unless you intend to move your main site. The chat lives only on **`chat.`** (or the subdomain shown in your dashboard).

## Nameservers vs DNS records (important)

- **Registrar** (Namecheap, GoDaddy, …): you bought the domain here.
- **DNS host** (where records actually live): might be the **same** as the registrar, or **Cloudflare**, **Route 53**, etc.

**Only one place controls your live DNS:** whichever **nameservers** your domain uses.

| If nameservers point to… | You edit records at… |
|--------------------------|----------------------|
| Namecheap default (“Namecheap BasicDNS”) | Namecheap → **Advanced DNS** |
| Cloudflare (e.g. `dana.ns.cloudflare.com`) | **Cloudflare** → DNS only |
| Your web host (Squarespace, Wix, etc.) | That host’s DNS panel |

If you switch nameservers (e.g. from Cloudflare back to Namecheap), **every** record must exist in the **new** place or **email and the main site can break**.

## Why your main site went down (common story)

1. Domain used **Cloudflare** nameservers → all records lived in **Cloudflare**.
2. You switched Namecheap to **BasicDNS** and only added **`chat`**.
3. Records for **`@`** (root) and **`www`** were **only** in Cloudflare → they disappeared from the public DNS → **gasfees.org** broke until you fixed it.

**Fix:** Either put **all** records (apex, `www`, `chat`, email, etc.) in **one** DNS panel, or keep nameservers on Cloudflare and **only** edit Cloudflare.

## Recommended setup (Namecheap domain + Cloudflare)

1. At **Namecheap**: Domain → **Nameservers** → **Custom DNS** → enter **only** Cloudflare’s two nameservers (from Cloudflare when you added the site).
2. At **Cloudflare** → **DNS** → **Records**:
   - Keep existing **A** / **CNAME** for **`@`** and **`www`** (your main site).
   - Add **CNAME** **`chat`** → target **`cname.vercel-dns.com`** (or the value ForwardSlash shows).  
   - For Vercel, Cloudflare often recommends **DNS only** (grey cloud) on that CNAME; if you use **Proxied** (orange), follow Vercel + Cloudflare docs for SSL.

3. In **ForwardSlash** dashboard: run **Go live** after the CNAME propagates.

## Propagation

DNS changes can take a few minutes to 48 hours. Use a checker like [dnschecker.org](https://dnschecker.org) on `chat.yourdomain.com` to see **CNAME** globally.

## Next steps

Open the guide for **your** DNS provider in the sidebar (Namecheap, Cloudflare, GoDaddy, etc.).
