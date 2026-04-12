# Namecheap domain + Cloudflare DNS

This is the usual setup when you buy the domain on **Namecheap** but run DNS (and often CDN) on **Cloudflare**.

## The rule

**Where your nameservers point is where you edit DNS.**

| Nameservers on Namecheap | Where you add `chat` CNAME |
|--------------------------|----------------------------|
| **Namecheap BasicDNS** | Namecheap → Advanced DNS |
| **Cloudflare** (e.g. `*.ns.cloudflare.com`) | **Cloudflare** → DNS → Records only |

If nameservers = Cloudflare, records you add in Namecheap’s **Advanced DNS** are **ignored** for public DNS.

## What went wrong when the main site went down

A common mistake:

1. Domain normally uses **Cloudflare** nameservers; **gasfees.org** and **www** records live **only** in Cloudflare.
2. You switched Namecheap to **BasicDNS** and added **`chat`** there.
3. The world stopped using Cloudflare for DNS → **apex/www records vanished** → main site down.
4. You fixed it by either moving everything to Namecheap **or** going back to Cloudflare nameservers.

## What you should do (recommended)

**Keep Cloudflare as DNS** and manage **all** records there.

### 1) Namecheap (registrar only)

1. **Domain List** → **Manage** → **Nameservers**.
2. Select **Custom DNS**.
3. Enter the **two** nameservers Cloudflare gave you when you added the site (e.g. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).

### 2) Cloudflare

1. Select your domain → **DNS** → **Records**.
2. Confirm you still have records for **`@`** (root) and **`www`** pointing to your real host (do not delete these).
3. Click **Add record**:
   - **Type:** CNAME  
   - **Name:** `chat`  
   - **Target:** `cname.vercel-dns.com` (or the exact value from ForwardSlash)  
   - **Proxy status:** Often **DNS only** (grey cloud) works best with Vercel SSL; if you use **Proxied** (orange), check [Vercel + Cloudflare](https://vercel.com/docs/concepts/edge-network/regions#cloudflare) docs.

4. Save.

### 3) ForwardSlash

Use **Go live** after the CNAME resolves (check with `dig chat.yourdomain.com CNAME` or [dnschecker.org](https://dnschecker.org)).

## If you prefer everything on Namecheap instead

1. **Re-create** every DNS record from Cloudflare into Namecheap **Advanced DNS** (apex, www, MX, TXT, etc.) — easy to miss something; export/compare carefully.
2. Switch nameservers back to **Namecheap BasicDNS**.
3. Add **`chat`** CNAME in Namecheap.

Most teams find **Cloudflare-only DNS** simpler long term.
