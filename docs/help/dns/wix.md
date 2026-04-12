# Wix — domain purchased or connected through Wix

## If Wix hosts your DNS

1. Wix Dashboard → **Settings** → **Domains** → your domain → **Manage** → **DNS** (or **Advanced DNS**).
2. **Add** a **CNAME** record:
   - **Host name:** `chat`  
   - **Points to:** `cname.vercel-dns.com`  
   - **TTL:** leave default if shown  

3. Save.

Wix’s labels vary; look for **CNAME** and a field for **subdomain** / **host** = `chat`.

## If the domain uses external nameservers

If you pointed nameservers to **Cloudflare** or the registrar, add **`chat`** at **that** DNS provider — not in Wix.

## Limitations

Some bundled Wix DNS UIs restrict certain record types. If you cannot add a CNAME for `chat`, contact Wix support or move DNS to Cloudflare (advanced).
