# Any DNS provider — add CNAME for `chat.`

Use this if your host is not listed in the sidebar, or you use a regional registrar.

## What to create

| Field | Value |
|-------|--------|
| **Type** | CNAME |
| **Host / Name / Alias** | `chat` (some panels want `chat.yourdomain.com` — same thing) |
| **Target / Value / Points to** | `cname.vercel-dns.com` — **or** the exact hostname ForwardSlash shows in dashboard / email |

No `http://` or `https://` in the target.

## Find the right panel

1. **Registrar** (where you pay for the domain): look for **DNS**, **Manage DNS**, **Zone editor**, **Advanced DNS**.
2. If you see **nameservers** pointing elsewhere (e.g. `*.ns.cloudflare.com`), log in to **that** service and add the record **there**.

## Conflicts

- You **cannot** have a **CNAME** named `chat` and another record with the same name (e.g. **A** on `chat`). Remove or rename the conflict.
- **`@`** (apex) cannot be a CNAME on some providers; **`chat`** is a subdomain — CNAME is allowed.

## Verify

- Online: [dnschecker.org](https://dnschecker.org) → type `chat.yourdomain.com` → **CNAME**.  
- Terminal: `dig chat.yourdomain.com CNAME +short`

Then use **Go live** in ForwardSlash.

## Still stuck

Screenshot your DNS list (redact unrelated values), confirm nameservers at the registrar, and support can tell you which panel is authoritative.
