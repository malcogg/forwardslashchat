# ForwardSlash.Chat - Landing Page: One Frame, Modal-Only Flow

Traditional landing page style. No scrolling. All actions happen in popup modals.

Last updated: February 2026

---

## Landing Frame (Single View, No Scroll)

**Layout:** One viewport. No scroll. Everything above the fold.

**Content:**
- Headline: "Hi, welcome."
- Subline: "Enter your website URL and we'll build your AI chatbot."
- Large centered input: `https://yourbusiness.com`
- Primary button: "Scan Website"
- Optional: small trust line below ("One-time payment • Your domain • 3-10 days")

**Style:** Traditional, clean, distinctive. Not chat-style. Unique typography and layout.

---

## Flow (All in Modals)

### Modal 1: Scanning
- User clicks "Scan Website"
- Full-screen modal opens immediately
- Center: "Scanning your site..."
- Blur background (backdrop-filter)
- Cycling status messages (optional)
- Close button (top-right)

### Modal 2: Results + Toggles
- Scan complete -> same modal updates (or smooth transition)
- "Nice site! We found **X pages** on yourbusiness.com"
- Content category toggles:
  - Products: 120 pages [ON]
  - Blog: 85 pages [ON]
  - Landing pages: 45 pages [ON]
  - Services: 30 pages [ON]
  - About/Contact: 20 pages [ON]
  - Other: 50 pages [OFF]
- User can toggle on/off before continuing
- Button: "Continue" or "See Your Price"

### Modal 3: Pricing + Payment
- Same modal or chained modal
- Center, blur background
- "Your Price" - tier auto-selected by page count
- Bundle options (1-5 years)
- Checkbox: "+$99 Help me set up DNS"
- Button: "Continue to Payment"
- Redirect to PayPal/Stripe

### After Payment
- Return to site
- Modal or inline: "Thank you! Create an account to access your dashboard."
- Sign up (Google, Apple, email)
- Redirect to /dashboard

---

## Modal Styling

- **Backdrop:** blur(8-12px) + dark overlay (opacity 0.4-0.6)
- **Modal:** Centered, max-width, rounded corners, subtle shadow
- **Close:** Top-right, subtle
- **Mobile:** Full-screen or bottom sheet with handle

---

## Summary

| Step | Location |
|------|----------|
| Welcome + enter URL | Landing frame (no scroll) |
| Scan | Modal |
| Results + toggles | Modal |
| Pricing + pay | Modal |
| Sign up | Modal or inline after return |
| Dashboard | New page |

---

## Implementation Notes

- One main route: `/` with the landing frame
- Modal state: scanning | results | pricing
- No page scroll; modal overlays the landing frame
- Use vaul for bottom sheets on mobile
- shadcn Dialog or custom modal component
