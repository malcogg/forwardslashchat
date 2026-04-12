# Shopify-managed domain

If the domain is connected to **Shopify** (Online Store → **Domains**):

1. **Settings** → **Domains** → select the domain → **DNS settings** / **Manage** (wording varies by Shopify version).
2. **Add custom record**:
   - **Type:** CNAME  
   - **Name:** `chat`  
   - **Value:** `cname.vercel-dns.com`  

3. Save.

## Store on Shopify, DNS elsewhere

If nameservers point to **Cloudflare** or your registrar, add the CNAME **there**, not in Shopify.

## Email

Do not remove **Shopify** or **third-party** **MX** / **SPF** records when adding **`chat`**.
