# ForwardSlash.Chat Demo — Q&A Reference

All questions and answers for the demo chatbot at `/chat/demo`. Matching uses `.toLowerCase()` and `.includes()` against keyword lists.

---

## Suggested Pills (4, top row)

1. What is ForwardSlash.Chat?
2. How much does it cost?
3. How does it work?
4. Quick $350 Starter?

---

## Suggested Questions (3, below pills)

1. Tell me about the $350 quick site
2. What's included in a new build?
3. How does the AI chatbot work?

---

## Q&A Pairs (14 total)

### 1. Pricing

**Keywords:** `how much`, `pricing`, `cost`, `plans`, `price`, `how much is it`

**Answer:**
> Simple one-time pricing — year 1 hosting included, no monthly fees ever.
> After year 1: move to your own host (free) or renew hosting with us for $200/year (optional).
> Tap a plan below to go straight to checkout — full details on [our services page](/services).

**Checkout pills:** Quick $350 Starter | $1,000 New Build | $2,000 Redesign

---

### 2. How it works

**Keywords:** `how does it work`, `how to get started`, `process`, `steps`

**Answer:**
> Easy 3 steps:
> 1. Tell us your business & goals
> 2. We design & build your site (with AI chatbot if chosen)
> 3. We launch + host for year 1 — live in days/weeks.
> One-time payment, no subscriptions. See the full [How it Works](/services#how-it-works) page.

---

### 3. Quick $350 Starter

**Keywords:** `quick`, `starter`, `$350`, `simple site`, `just get started`

**Answer:**
> Our $350 Quick WordPress Starter is perfect if you just want a simple site fast: 10 clean pages, mobile-ready, basic SEO, contact form + map, WordPress dashboard, year 1 hosting included. One-time $350 — no monthly fees. Great for new entrepreneurs!

**Checkout pill:** Get Your $350 Site Now

---

### 4. New Website / $1,000 Build

**Keywords:** `new website`, `brand new`, `$1000`, `build`

**Answer:**
> For $1,000 one-time we build you a full custom modern website (Next.js or WordPress) + built-in AI chatbot trained on your content. Mobile-responsive, fast, SEO-ready, year 1 hosting included. Perfect upgrade for growing businesses.

**Checkout pill:** Start $1,000 Build

---

### 5. Redesign / $2,000 Refresh

**Keywords:** `redesign`, `refresh`, `upgrade`, `$2000`

**Answer:**
> $2,000 one-time redesign/refresh: modern look, speed & SEO upgrades, mobile-responsive, + built-in AI chatbot. We keep your existing content, make it look & work better, host year 1. Ideal if your current site feels outdated.

**Checkout pill:** Start $2,000 Redesign

---

### 6. AI Chatbot

**Keywords:** `ai chatbot`, `ai`, `chatbot`, `what is the ai`

**Answer:**
> Every plan can include our custom AI chatbot (trained only on your site content). It lives at chat.yourdomain.com or yourdomain.com/chat, answers customer questions 24/7 — services, hours, prices, FAQs — no monthly fees, private & branded. See it in action on the [Demo](/chat/demo).

---

### 7. Hosting

**Keywords:** `hosting`, `host`, `year 1`, `after year 1`, `renew`

**Answer:**
> We host your site for the full first year (included in price). After that: move to your own host for free (we give full access) or keep us hosting for $200/year (optional). Your choice — no lock-in.

---

### 8. Florida / Orlando / Local

**Keywords:** `florida`, `orlando`, `local`

**Answer:**
> We're based in Orlando, Florida and specialize in helping local businesses like plumbers, shops, restaurants, and contractors get a professional online presence fast — affordable, no-nonsense websites + AI help.
> [Book a chat with Michael Francis](Cal.com link)

---

### 9. Demo

**Keywords:** `demo`, `see it`, `try`, `test`

**Answer:**
> You're chatting with the demo right now! Tap any pill above or ask about our websites, AI chatbot, pricing, or getting started.
> Want to see more? Visit the full [Demo](/chat/demo).

---

### 10. Dashboard

**Keywords:** `dashboard`, `how to use dashboard`, `what is dashboard`

**Answer:**
> After payment, you get a dashboard to track your order, upload extra files, customize branding (logo/colors), view DNS instructions, and see your live site/chatbot URL once deployed. Super simple — no tech skills needed.

---

### 11. Branding

**Keywords:** `branding`, `customize`, `logo`, `colors`

**Answer:**
> In your dashboard, upload your logo/favicon, pick accent/background colors — your website and AI chatbot will match your brand perfectly. Easy drag-and-drop.

---

### 12. How long / Delivery

**Keywords:** `how long`, `delivery time`, `when will it be ready`, `timeline`

**Answer:**
> Most sites launch in days to a few weeks depending on plan. Quick $350 starter is fastest. We aim for 3–10 business days after you approve the design.

---

### 13. Help / Support / Contact

**Keywords:** `help`, `support`, `contact`, `questions`

**Answer:**
> We're here for you! Reach out to Michael Francis anytime:
> Email: michael@forwardslash.chat
> [Book a quick chat](Cal.com link)
> We're based in Orlando, Florida and reply fast.

---

### 14. What is ForwardSlash.Chat

**Keywords:** `what is`, `what does forwardslash do`, `what is forwardslash.chat`, `tell me about`

**Answer:**
> **ForwardSlash.Chat** helps new entrepreneurs and local businesses in Florida get online fast with a professional website + built-in AI chatbot. We build it, host it for year 1, and you pay once — no monthly fees.
> From a quick [starter site for $350](/services#pricing) to full custom builds.
> Check the [demo](/chat/demo) or see [how it works](/services#how-it-works).

---

## Fallback (no keyword match)

**Answer:**
> Sorry, I'm still learning! 😊 Ask me about our $350 quick start site, $1,000 new build, $2,000 redesign, AI chatbot, or how we help Florida businesses get online. Or [contact us](Cal.com link) directly.

---

## Checkout pills

Some answers include compact pill-style buttons that link to checkout:

| Plan | URL | Pill label |
|------|-----|------------|
| Starter | `/checkout?plan=starter` | Quick $350 Starter / Get Your $350 Site Now |
| New Build | `/checkout?plan=new-build` | $1,000 New Build / Start $1,000 Build |
| Redesign | `/checkout?plan=redesign` | $2,000 Redesign / Start $2,000 Redesign |

---

## Matching logic

- User message is lowercased and trimmed
- Each Q&A pair is checked in order (first match wins)
- For each pair, we check if the message **includes** any of the keywords
- If no pair matches → use fallback

## Typing delay

- **1,600ms** (1.6 seconds) before the answer is shown

## Links

- Internal links (e.g. `/services`, `/chat/demo`) use Next.js `Link` for client-side navigation
- External links (e.g. Cal.com) open in new tab
- Cal.com URL: `NEXT_PUBLIC_STRATEGY_CALL_URL` or default `https://cal.com/forwardslash/30min`
