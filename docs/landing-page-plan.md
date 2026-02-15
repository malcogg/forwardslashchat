# ForwardSlash.Chat - Landing Page Plan (Modal-First Flow)

This plan defines the landing page experience. **Canonical spec:** See
[LANDING-PAGE-ONE-FRAME-MODAL-FLOW.md](LANDING-PAGE-ONE-FRAME-MODAL-FLOW.md)
for the one-frame, no-scroll, modal-only approach.

## Core Concept

- **Traditional style** (not chat-style) - distinctive, unique
- **One frame, no scroll** - everything fits in one viewport
- **All actions in popup modals** - scan, results, toggles, pricing
- Center modals with blur background

## Landing Page (Initial View - Single Frame)

One viewport. No scrolling.

- Headline: "Hi, welcome."
- Subline: "Enter your website URL and we'll build your AI chatbot."
- Large centered input: `https://yourbusiness.com`
- Primary button: "Scan Website"
- Optional: "One-time payment • Your domain • Delivered in 3-10 days"

## Scan Flow - Full-Screen Modal

1. User clicks Scan Website
   - Full-screen modal opens immediately
   - Background is blurred (backdrop-filter: blur(8px))
   - Modal shows:
     - Close button (top-right)
     - Centered progress spinner
     - Cycling status messages:
       - "Reading your homepage..."
       - "Looking at your services and pricing..."
       - "Finding your blog and testimonials..."
       - "Checking contact and booking info..."
       - "Almost ready..."

2. Scan complete -> results + content toggles in same modal
   - Headline: "Nice site! We found X pages on yourbusiness.com"
   - Content category toggles (user can toggle on/off before continuing):
     - Products, Blog, Landing pages, Services, About/Contact, Other
   - Only toggled-ON content gets scraped for the bot
   - Confidence block (icon bullets):
     - Services and pricing pages
     - About your team
     - Customer testimonials
     - Blog and tips
     - Contact and booking forms
   - Trust summary:
     - Instant answers from your real content
     - Branded look and feel (your colors + logo)
     - Lives on chat.yourbusiness.com
     - No monthly fees - pay once
   - Primary CTA: "See Your Price ->" or "Get Started ->"

3. Pricing modal / bottom sheet (auto-selected by page count)
   - Page count from scan determines tier (customer doesn't have to choose):
     - Under 300 pages -> Small tier pre-selected
     - 300-1,000 pages -> Medium tier pre-selected
     - 1,000-5,000 pages -> Large tier pre-selected
     - 5,000+ pages -> Enterprise (Contact us)
   - Title: "Your Price" or "Choose Your Plan"
   - Show: "Based on your X pages, we recommend [tier]"
   - Display the matching tier prominently; other tiers available if they want to change
   - Bundles: 1y $550, 2y $850, 3y $1,250, 4y $1,600, 5y $1,950 (or setup+monthly if that model)
   - Checkbox: "+$99 - Help me set up my domain (DNS)"
   - Live total
   - Button: "Continue to Payment"
   - "Start pricing" - they see the price without having to think about which tier

4. Payment
   - Redirect to PayPal checkout (Stripe fallback)
   - Return to site after success

5. Account creation (required - all users must sign up after payment)
   - Modal closes automatically
   - User sees: "Thank you! Your payment was successful."
   - Prompt: "Create an account to access your dashboard"
   - Options: Google (preferred), Apple, or email + password
   - No dashboard access until they sign up

6. Post-sign-up redirect
   - After account creation -> redirect to /dashboard
   - Dashboard shows:
     - Order confirmed and prepaid period
     - Estimated delivery date
     - Final chatbot URL
     - DNS instructions section
     - Upload more files / request revisions
     - Current status (Processing site or Waiting for DNS)

## Mobile Behavior

- Modals become bottom sheets with drag handle
- Pricing sheet is scrollable
- Seamless redirect: payment -> sign up -> dashboard

## Visual and UI Guidelines

- Backdrop blur: 8-12px with dark overlay (opacity 0.4-0.6)
- Rounded corners, subtle shadow, optional glass effect
- Large primary button with hover glow
- Icons: lucide-react (wrench, users, star, pen, calendar)
- Loading messages with fade/typing animation
- Results bullets fade in with checkmark animation

## Page Count -> Tier Mapping (for auto-pricing)

| Page count | Tier | Fallback if scan fails |
|------------|------|------------------------|
| Under 300 | Small | Small, or "Contact us for custom quote" |
| 300-1,000 | Medium | Medium |
| 1,000-5,000 | Large | Large |
| 5,000+ | Enterprise | Contact us |
| Scan failed / timeout | — | Default to Small, or show "Contact us" |

Very small sites (under 10 pages): still Small tier; note that they can add extra files to improve the chatbot.

## Implementation Notes

- Use shadcn/ui components
- Use vaul for bottom sheets on mobile
- Keep modal flow smooth and fast, no page reloads during scan steps
- Scan API: Firecrawl or similar; return page count + optional content preview