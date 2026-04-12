# GoDaddy — add CNAME for `chat.`

## Steps

1. Sign in to [GoDaddy](https://www.godaddy.com/) → **My Products** → **DNS** (or **Manage DNS**) for your domain.
2. Open **DNS Records** (sometimes under **Domain** → **Manage DNS**).
3. **Add** a new record:
   - **Type:** CNAME  
   - **Name:** `chat` (GoDaddy may show as “chat” or “chat.yourdomain.com”)  
   - **Value / Points to:** `cname.vercel-dns.com` (no `https://`)  
   - **TTL:** 1 hour or default  

4. Save.

## GoDaddy + external DNS

If GoDaddy shows **nameservers** set to a third party (e.g. Cloudflare), add the CNAME **at that provider**, not in GoDaddy’s DNS table.

## Forwarding

If **Domain forwarding** is enabled for the apex, it usually does not affect **`chat.`** as long as you add the CNAME. If something conflicts, open a ticket with GoDaddy and mention you need a **subdomain CNAME** alongside forwarding.

## Next

Complete **Go live** in the ForwardSlash dashboard.
