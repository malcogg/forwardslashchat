# Cloudflare — CNAME for `chat.`

Use this when **Cloudflare** is your DNS host (domain’s nameservers are Cloudflare’s).

## Steps

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → select your domain.
2. Go to **DNS** → **Records**.
3. **Add record**:
   - **Type:** CNAME  
   - **Name:** `chat` (Cloudflare shows `chat.yourdomain.com`)  
   - **Target:** `cname.vercel-dns.com` (or the CNAME target from your ForwardSlash go-live instructions)  
   - **TTL:** Auto  
   - **Proxy status:** Many Vercel setups use **DNS only** (grey cloud) for the chat subdomain so SSL certificates issue cleanly. If you need **Proxied** (orange cloud), confirm Vercel still validates the domain.

4. Save.

## Do not remove existing records

Keep **A** or **CNAME** for **`@`** and **`www`** unless you are intentionally moving the main site. Only **add** the `chat` record.

## Email (MX)

Leave **MX** and related **TXT** records unchanged.

## Verify

Use **Go live** in ForwardSlash after propagation, or query:

`dig chat.yourdomain.com CNAME +short`
