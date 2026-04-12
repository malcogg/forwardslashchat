# Network Solutions — CNAME for `chat.`

1. Log in to [Network Solutions](https://www.networksolutions.com/) → **Account Manager** → **My Domain Names** → your domain.
2. Open **Edit DNS** / **Manage Advanced DNS** / **DNS Manager** (label varies).
3. **Add** a **CNAME**:
   - **Alias / Host:** `chat`  
   - **Points to / Refers to:** `cname.vercel-dns.com`  

4. Save changes.

## Slow propagation

Network Solutions historically had slower TTLs; allow extra time before **Go live** in ForwardSlash.
