# Bluehost — CNAME for `chat.`

1. Log in to **Bluehost** control panel → **Domains** → **Zone Editor** (or **Advanced DNS**).
2. **Add Record**:
   - **Type:** CNAME  
   - **Host:** `chat`  
   - **Points to:** `cname.vercel-dns.com`  

3. Save.

## Bluehost + Cloudflare

Many users enable Cloudflare through Bluehost. If nameservers are Cloudflare’s, manage the CNAME in **Cloudflare**, not Bluehost’s zone editor.
