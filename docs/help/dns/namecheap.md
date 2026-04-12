# Namecheap — add CNAME for `chat.`

Use this guide when **Namecheap is your DNS host** (default **Namecheap BasicDNS** nameservers).

## Before you start

- Confirm your **ForwardSlash** dashboard shows the exact **CNAME target** (usually `cname.vercel-dns.com`).
- Subdomain to create: **`chat`** (full hostname: `chat.yourdomain.com`).

## Steps

1. Log in to [Namecheap](https://www.namecheap.com/) → **Domain List** → **Manage** next to your domain.
2. Open the **Advanced DNS** tab.
3. Under **Host Records**, click **Add New Record**.
4. Choose **Type** → **CNAME Record**.
5. Set **Host** to **`chat`** (Namecheap will show `chat.yourdomain.com`).
6. Set **Target** to **`cname.vercel-dns.com.`** (trailing dot is optional in Namecheap; if it adds one automatically, that’s fine).
7. **TTL**: Automatic or 5 min is fine.
8. Save.

## If you use Namecheap’s nameservers but email lives here

Do **not** delete existing **MX** or **TXT** (SPF/DKIM) records. Only add the new **CNAME** for `chat`.

## If your nameservers are NOT Namecheap

If the domain uses **Custom DNS** pointing to **Cloudflare** (or others), you **do not** add the CNAME in Namecheap — add it where your DNS is hosted. See **[Namecheap + Cloudflare](/help/dns/namecheap-cloudflare)**.

## After saving

Return to **ForwardSlash** → **Go live** (or your DNS check step). Wait a few minutes if verification fails; DNS propagation can lag.
