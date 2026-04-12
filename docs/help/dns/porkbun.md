# Porkbun — CNAME for `chat.`

1. Log in to [Porkbun](https://porkbun.com/) → **Domain Management** → select your domain.
2. Open **DNS** (or **Edit** under DNS Records).
3. **Add** under **DNS Records**:
   - **Type:** CNAME  
   - **Host:** `chat`  
   - **Answer / Target:** `cname.vercel-dns.com`  
   - **TTL:** 300 or default  

4. Save.

## Third-party DNS

If Porkbun shows **third-party nameservers**, add the record at that provider instead.
