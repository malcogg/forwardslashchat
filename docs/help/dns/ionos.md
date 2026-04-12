# IONOS (1&1) — CNAME for `chat.`

1. Log in to [IONOS](https://www.ionos.com/) → **Domains & SSL** → your domain → **DNS**.
2. **Add record**:
   - **Type:** CNAME  
   - **Hostname:** `chat`  
   - **Points to:** `cname.vercel-dns.com`  

3. Save.

## IONOS “default” vs external

If the domain uses **external nameservers**, edit DNS at that host (Cloudflare, etc.).
