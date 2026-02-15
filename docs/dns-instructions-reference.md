# ForwardSlash.Chat - DNS Instructions Reference

This document provides the exact copy-paste instructions for customers to point
their subdomain to ForwardSlash.Chat using a CNAME record.

Last updated: February 2026

## Universal CNAME Instructions (copy-paste)

Tell the customer to add this record in their DNS provider:

```
Type: CNAME
Host/Name: chat
Value/Points to: cname.forwardslash.chat
TTL: Auto
```

Notes:

- Host/Name can be `chat` or any subdomain they chose (ai, support, help, etc.)
- TTL can be Auto or the default if they are unsure
- DNS propagation can take a few minutes to a few hours

## Provider-Specific Quick Steps

These are short guides to match common UIs. Keep them lightweight.

### Cloudflare

1. Select the domain.
2. Go to DNS.
3. Add record -> CNAME.
4. Name: chat
5. Target: cname.forwardslash.chat
6. Save.

### GoDaddy

1. Go to your domain settings.
2. DNS -> Add record.
3. Type: CNAME.
4. Host: chat.
5. Points to: cname.forwardslash.chat.
6. Save.

### Namecheap

1. Domain List -> Manage.
2. Advanced DNS tab.
3. Add new record -> CNAME.
4. Host: chat.
5. Value: cname.forwardslash.chat.
6. Save changes.

### Squarespace

1. Domains -> DNS settings.
2. Add record -> CNAME.
3. Host: chat.
4. Data/Target: cname.forwardslash.chat.
5. Save.

### Google Domains (or Squarespace Domains)

1. DNS -> Custom records.
2. Add -> CNAME.
3. Name: chat.
4. Data: cname.forwardslash.chat.
5. Save.

## Verification Notes

- We can verify once the record resolves to our app.
- SSL will be issued automatically by Vercel after DNS propagates.
