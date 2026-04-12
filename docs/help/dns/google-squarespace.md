# Google Domains / Squarespace Domains

**Google Domains** customers were migrated to **Squarespace Domains**. The UI may say “Squarespace” or “Google Workspace” branding; the steps are similar.

## Squarespace Domains (current)

1. Log in to [Squarespace Domains](https://www.squarespace.com/domains) (or your Squarespace account where the domain is registered).
2. Open the domain → **DNS** or **DNS Settings**.
3. **Add record**:
   - **Type:** CNAME  
   - **Host:** `chat`  
   - **Points to / Data:** `cname.vercel-dns.com` (use ForwardSlash’s exact target if different)  
   - **TTL:** default  

4. Save.

## If DNS is hosted elsewhere

Squarespace may show **custom nameservers**. If so, add **`chat`** at **that** DNS provider (Cloudflare, etc.), not in Squarespace.

## Legacy Google Domains notes

If you still see a Google Domains–style panel, look for **DNS** → **Custom records** → add **CNAME** `chat` → `cname.vercel-dns.com`.
