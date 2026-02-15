# DNS Setup Guide for Customers

## Overview

Your AI chatbot will live on **your own domain** (e.g., `chat.frankgayservices.com`), not on a subdomain of ForwardSlash.Chat. This keeps your branding consistent and gives customers confidence they're on your official site.

## How It Works

1. You choose a subdomain on your domain (common choices: `chat`, `ai`, `support`, `help`, `assistant`)
2. You add a CNAME record in your DNS settings pointing that subdomain to our server
3. We handle the rest - your chatbot goes live on your domain with automatic SSL

## Step-by-Step Instructions

### Step 1: Choose Your Subdomain

Pick what feels right for your business:
- `chat.yourbusiness.com` ← Most common
- `ai.yourbusiness.com`
- `support.yourbusiness.com`
- `help.yourbusiness.com`
- `assistant.yourbusiness.com`

### Step 2: Add CNAME Record

Log into your DNS provider (where you manage your domain). Common providers include:
- GoDaddy
- Cloudflare
- Namecheap
- Google Domains
- Bluehost
- HostGator

Look for "DNS Settings", "DNS Management", or "DNS Records"

### Step 3: Create the CNAME Record

Add a new record with these settings:

| Field | Value |
|-------|-------|
| **Type** | CNAME |
| **Name** | chat (or your chosen subdomain) |
| **Value** | `cname.forwardslash.chat` (we'll provide the exact value) |
| **TTL** | 3600 (or leave as default/automatic) |

**Example for Frank Gay Services:**
```
Type: CNAME
Name: chat
Value: cname.forwardslash.chat
TTL: 3600
```

This creates: `chat.frankgayservices.com`

### Step 4: Save and Wait

- Save your DNS changes
- DNS propagation typically takes **5-30 minutes** (sometimes up to 24 hours)
- You'll receive an email when your chatbot is live
- SSL certificate is automatically provisioned (HTTPS)

## Provider-Specific Guides

### GoDaddy

1. Log into GoDaddy
2. Go to **My Products** → **Domains**
3. Click the domain name
4. Scroll down to **Additional Settings** → **Manage DNS**
5. Under **Records**, click **Add**
6. Select **CNAME** from the Type dropdown
7. Name: `chat`
8. Value: `cname.forwardslash.chat`
9. TTL: 1 Hour (default)
10. Click **Save**

### Cloudflare

1. Log into Cloudflare
2. Select your domain
3. Go to **DNS** in the left menu
4. Click **Add record**
5. Type: **CNAME**
6. Name: `chat`
7. Target: `cname.forwardslash.chat`
8. Proxy status: **DNS only** (gray cloud - important!)
9. Click **Save**

### Google Domains

1. Log into Google Domains
2. Click your domain
3. Click **DNS** in the left menu
4. Scroll to **Custom resource records**
5. Name: `chat`
6. Type: **CNAME**
7. TTL: 1H
8. Data: `cname.forwardslash.chat`
9. Click **Add**

### Namecheap

1. Log into Namecheap
2. Select **Domain List** → Click **Manage** next to your domain
3. Go to **Advanced DNS** tab
4. Click **Add New Record**
5. Type: **CNAME Record**
6. Host: `chat`
7. Value: `cname.forwardslash.chat`
8. TTL: Automatic
9. Click the green checkmark to save

## Verification

Once DNS propagates, verify your setup:

1. Visit `https://chat.yourbusiness.com` (replace with your actual subdomain)
2. You should see your branded chatbot interface
3. SSL should be active (padlock icon in browser)
4. Try asking a test question

## Troubleshooting

### "Site can't be reached" or "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** DNS hasn't propagated yet  
**Solution:** Wait 5-30 minutes and try again. DNS changes can take time.

### "Your connection is not private" or SSL warning

**Cause:** SSL certificate is still being provisioned  
**Solution:** Wait 5-10 minutes. We automatically provision SSL for your domain.

### Chatbot loads but shows wrong company

**Cause:** Domain mapping issue on our end  
**Solution:** Contact us - we'll fix the mapping immediately.

### Changes not showing up after 24 hours

**Cause:** Possible DNS cache or incorrect CNAME value  
**Solution:** 
1. Verify your CNAME record is exactly as provided
2. Try clearing your browser cache
3. Try in incognito/private mode
4. Contact us for support

## Need Help?

We're here to help! Contact us at:
- Email: support@forwardslash.chat
- Or purchase our DNS setup service ($100 one-time) and we'll handle everything for you

## Security & Privacy

- **SSL/HTTPS:** Automatically provisioned and renewed
- **No data access:** We never have access to your DNS account
- **Full control:** You maintain complete control of your domain
- **Easy removal:** Delete the CNAME record anytime to disconnect

## Optional: Custom Path

Instead of a subdomain, you can also use a path on your main domain:
- `frankgayservices.com/chat` ← Alternative approach

This requires a different setup (reverse proxy). Contact us if you prefer this option.

---

## Quick Reference Card

**What you need to do:**
```
Add CNAME record in your DNS:

Name/Host: chat
Type: CNAME  
Value: cname.forwardslash.chat
TTL: 3600 (or default)
```

**Result:**
Your chatbot will be live at: `https://chat.yourbusiness.com`

**Timeline:**
5-30 minutes for DNS propagation + SSL provisioning
