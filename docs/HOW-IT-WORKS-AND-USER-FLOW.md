# ForwardSlash.Chat - How It Works and User Flow

This document describes the intended customer experience on the website and the
high-level user flow for MVP.

Goal: simple, fast, trustworthy, non-technical-friendly process  
Target: small/local business owners who want a custom AI chatbot without monthly fees

## Overall promise (what the landing page should communicate)

- You give us your website -> we train a smart ChatGPT-style chatbot on it
- One-time payment -> you get a branded chatbot on your own domain
- No monthly subscription, no per-message fees
- Hosting and maintenance included for the prepaid period (1-5 years depending on bundle)
- Delivered in 3-10 business days

## User flow on the website (MVP)

### 1. Landing page -> first impression

Visitor sees:

- Hero section: big headline + subheadline + mockup of chat interface
- Clear value: "One-time payment. Your own AI assistant. No monthly fees."
- Pricing table (1y $550, 2y $850, 3y $1,250, 4y $1,600, 5y $1,950)
- Recommended: 2-Year Bundle - Save $190
- Demo link: "See it live -> demo.forwardslash.chat"
- Big CTA button: "Get Your Chatbot ->"

### 2. "Get Your Chatbot" button -> Step 1 - Enter website

User clicks and sees a simple form:

- Business name
- Website URL (required)
- Desired subdomain (placeholder: "chat", "ai", "support", "help", etc.)
  - Small note: "This will become chat.yourbusiness.com"
- Optional: upload files (PDFs, docs, FAQs, product lists)

Button: "Scan Website ->" (opens full-screen modal)

### 3. Instant feedback - framework detection and crawl preview

After submitting URL (client-side or quick API call):

- Show loading spinner: "Analyzing your website..."
- After 5-15 seconds: show result

Example screen:

We scanned your site!  
Detected: WordPress (high confidence)  
Pages found: ~45  
Recommended structure: chat.yourbusiness.com  
Looks good! -> Continue to pricing

If detection fails: "Custom/static site - we'll do a full crawl"

This step builds trust and shows "magic" without giving away too much tech detail.

### 4. Pricing and checkout

User sees:

- Pricing table with the bundles (1-5 years)
- Pre-selected: 2-year bundle ($850) as default/recommended
- Dynamic total:
  - Base price
  - +$100 DNS help checkbox (default: unchecked)
- "Pay with PayPal" button (Stripe as fallback)

After choosing plan and optional DNS help, send to PayPal checkout (Stripe fallback).

All scan, results, and pricing steps happen inside a modal or bottom sheet with
blurred background.

### 5. After successful payment -> account creation

User sees:

Thank you! Your payment was successful.

Then:

Please create an account to track your order and receive updates.

Options:

- Continue with Google
- Continue with Apple (optional)
- Email + password

Keep sign-up minimal. Google is preferred.

### 6. Post-payment - dashboard (first view)

After sign-up, redirect to dashboard.

MVP dashboard should be simple with 3-4 sections:

1. Order status card (most important)
   - Current status: Payment confirmed -> Content collection -> Crawling website ->
     Training AI -> DNS setup -> Testing -> Delivered
   - Estimated delivery date: "Expected: Feb 20 - Feb 27, 2026"
   - Progress bar or simple timeline

2. Your chatbot details
   - Business name
   - Website used for training
   - Chosen subdomain: chat.yourbusiness.com
   - Final URL (once DNS is set): https://chat.yourbusiness.com
   - Prepaid until: March 10, 2027 (example)
   - Edit branding button (colors, logo, welcome message) for limited changes

3. DNS setup section (very important)
   - If they chose "we help with DNS":
     - "We're preparing to set up your DNS. Please reply to the confirmation
       email with your DNS provider access details (Cloudflare API key / login /
       screenshot)."
     - Status: "Waiting for your DNS info"
   - If they chose self-setup:
     - Big green button: "View DNS instructions"
     - Copy-paste CNAME block:
       ```
       Type: CNAME
       Host/Name: chat
       Value/Points to: cname.forwardslash.chat
       TTL: Auto
       ```
     - Links to guides: Cloudflare / GoDaddy / Namecheap / Squarespace
     - "Already added? Click here to verify" (optional)

4. Next steps / help
   - "What happens next?" -> short 3-step explanation
   - "Need to send extra files or change something?" -> upload or message support
   - "Questions?" -> email link or simple form

### 7. Later - delivery and post-delivery dashboard

When chatbot is live:

- Status changes to Delivered
- Shows live URL prominently
- "Test your chatbot now" button
- Optional embed code section
- Renewal reminder appears ~30 days before end of prepaid period

## Summary - MVP dashboard philosophy

Keep it minimal and focused:

- One screen
- Clear status
- DNS instructions front and center
- Ability to upload extra files or request small changes
- No complex analytics, no chat history, no settings overload

This is enough for MVP. You can expand later (order history, multiple chatbots,
usage stats, etc.).
