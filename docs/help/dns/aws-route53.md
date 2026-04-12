# AWS Route 53 — CNAME for `chat.`

## Hosted zone

1. Open [Route 53](https://console.aws.amazon.com/route53/) → **Hosted zones** → select your domain’s zone.
2. **Create record**:
   - **Record name:** `chat`  
   - **Record type:** CNAME  
   - **Value:** `cname.vercel-dns.com` (trailing dot optional in Route 53)  
   - **Routing policy:** Simple  
   - **TTL:** 300 seconds is a reasonable default  

3. Create.

## Apex on Route 53

If **`@`** uses **A** records (ALIAS to CloudFront, API Gateway, etc.), leave them as-is. The **`chat`** CNAME is independent.

## Registrar vs Route 53

If the domain is registered elsewhere, ensure the domain’s **nameservers** point to the **Route 53** hosted zone’s four NS records; otherwise changes in Route 53 won’t apply.

## Finish

Run **Go live** in ForwardSlash after DNS propagates.
