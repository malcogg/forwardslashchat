# Pre-dashboard onboarding — flow matrix & UI

This doc defines **Path A** (has website → AI chatbot) vs **Path B** (no website → website upsell + chatbot), screen order, and UI patterns. **Storage:** `user_onboarding` table (see `docs/migrations/015-user-onboarding.sql`).

---

## Where it lives in the product

| Placement | Role |
|-----------|------|
| **Homepage** | One primary CTA (e.g. “Get started”). First step: **Do you already have a live website?** — not two competing hero buttons. |
| **After choice** | Path A: continue URL → scan → roast → sign-in → **onboarding** → checkout/dashboard. Path B: **onboarding** (no URL required first) → website + chatbot story → checkout. |
| **Post sign-in** | Full-screen or modal onboarding **before** `/dashboard` if `user_onboarding.completed_at` is null (or feature flag). |

---

## Path A — Has website → chatbot

| Step | Screen | Question / action | Required | Skippable |
|------|--------|-------------------|----------|-----------|
| A0 | Branch (homepage or modal) | “Already have a live website?” → Yes | — | No |
| A1 | URL | Confirm or edit URL (pre-filled from scan) | Yes | — |
| A2 | Scan / results | Existing scan + pricing (pages) | — | — |
| A3 | Sign in | Clerk | Yes | — |
| A4 | DNS help | “Who will add DNS records for chat.yourdomain?” — Self / Walk me through / Someone else | Yes* | *Can default + skip |
| A5 | Referral | How did you hear about us? | No | Yes |
| A6 | Existing AI | Do you already have an AI assistant on your site? | No | Yes |
| A7 | Industry | Business type (chips + Other) | No | Yes |
| A8 | Use case | Primary job for the assistant (support / leads / bookings / other) | No | Yes |
| A9 | Done | Continue to checkout or dashboard | — | — |

\*DNS is business-critical; prefer short copy and a default (e.g. “I’ll try myself”) so skip still sets a value.

---

## Path B — No website → website upsell + chatbot

| Step | Screen | Question / action | Required | Skippable |
|------|--------|-------------------|----------|-----------|
| B0 | Branch | “Already have a live website?” → No | — | No |
| B1 | Positioning | One full screen: website build + AI chat when live (no form, or single CTA “Next”) | — | — |
| B2 | Project | What are you building? (short text or chips) | No | Yes |
| B3 | Timeline | When do you want to launch? (This month / 1–3 mo / exploring) | No | Yes |
| B4 | Sign in | Clerk | Yes | — |
| B5 | Referral | How did you hear about us? | No | Yes |
| B6 | Industry | Business type (optional) | No | Yes |
| B7 | DNS / domain | “Do you already own a domain?” → If yes, DNS help preference when relevant | No | Partial |
| B8 | Done | Route to website SKU checkout; chatbot add-on or phase-2 CTA | — | — |

Path B may land **checkout** before a crawl exists; `website_url_snapshot` can be empty until they add a domain later.

---

## UI design (aligned with existing system)

### Option 1 — Centered modal (homepage / pre-auth)

- **Overlay:** `fixed inset-0 z-50 bg-background/80 backdrop-blur-sm` (or `bg-black/40` in light if you prefer contrast).
- **Panel:** `max-w-lg w-full mx-4 rounded-xl border border-border bg-card shadow-lg p-6 md:p-8`.
- **Typography:** `text-base font-semibold` title; body `text-sm text-muted-foreground leading-snug` (see `DESIGN_SYSTEM.md`).
- **Primary:** single emerald/primary `Button`; secondary ghost for “Back”.
- **Mobile:** full width with safe padding; modal becomes near full-height sheet if needed (`max-h-[90dvh] overflow-y-auto`).

**Use for:** first branch (has site / no site), quick 1–2 steps before scan or sign-in.

### Option 2 — Full-page onboarding (post sign-in)

- **Layout:** `min-h-screen bg-background` with `max-w-lg mx-auto px-4 py-8 flex flex-col`.
- **Header:** optional logo + “Step N of M” as `text-xs text-muted-foreground`.
- **Progress:** **dots** centered at bottom — `flex gap-1.5 justify-center` with active dot `w-2 h-2 rounded-full bg-primary` and inactive `bg-muted`.
- **Skip:** `text-sm text-muted-foreground hover:text-foreground` top-right or below primary (only on skippable steps).
- **Motion:** optional subtle `framer-motion` step transition (match dashboard if already used).

**Use for:** 4–7 questions after auth so the experience feels “like the app” and immersive (ElevenLabs-style).

### Shared rules

- **One question per screen** when possible.
- **Dots** reflect **visible steps in the current path** (Path A vs B have different counts — compute `totalSteps` from branch).
- **Skip** sets `skipped_step_ids` in DB and advances; optional fields stay null.
- **Accessibility:** `role="dialog"` + `aria-modal` on modals; focus trap; visible focus rings (`DESIGN_SYSTEM.md`).

---

## After completion

- **Upsert** `user_onboarding` for `user_id`, set `completed_at`.
- **Redirect** to `/dashboard` or `/checkout?...` depending on product rule.
- **Dashboard:** if `completed_at` set, do not show onboarding again (unless admin “reset onboarding” later).

---

## DB column map (see migration)

| Field | Path A | Path B |
|-------|--------|--------|
| `path` | `has_website` | `no_website` |
| `dns_help_preference` | ✓ | If domain owned |
| `referral_source` | ✓ | ✓ |
| `has_existing_ai_chat` | ✓ | Optional / N/A |
| `industry` | ✓ | ✓ |
| `assistant_primary_use` | ✓ | Optional |
| `website_url_snapshot` | From scan | Optional |
| `no_site_project_note` | — | ✓ |
| `no_site_timeline` | — | ✓ |
| `skipped_step_ids` | array | array |
| `extra` | JSON for future | JSON for future |

---

## Implementation order (engineering)

1. Run migration `015` in Neon.
2. Add Drizzle model + API `POST /api/onboarding` (upsert) + `GET` for client state.
3. Middleware or dashboard layout: redirect incomplete onboarding to `/onboarding`.
4. Build step components (shared `OnboardingLayout` with dots + skip).
5. Homepage: wire branch → existing scan flow vs new Path B route.
