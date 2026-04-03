# ForwardSlash.Chat — dashboard design system

This document describes the visual language used on the **desktop dashboard** (≥1024px). It aligns with Tailwind CSS variables in `app/globals.css`, shadcn-style primitives in `components/ui/`, and 2026 SaaS patterns: clarity, whitespace, and one obvious primary action per view.

## Principles

- **One primary path** — Each card or section exposes a single dominant CTA; secondary actions are outline or ghost.
- **Progress truth** — Step labels reflect *actual* state (e.g. “Complete payment” until paid, then “Payment received”).
- **Preview as hero** — The live chat preview owns the right column (~55–60% width at `xl`) so customers see the product while they work through setup.
- **Quiet chrome** — Surfaces use borders and soft backgrounds; avoid heavy gradients except for intentional emphasis (success, upsell).

## Spacing

| Token / use        | Value                          |
|--------------------|--------------------------------|
| Page padding       | `px-6` header, `px-6`–`px-8` main |
| Section gap        | `gap-6`–`gap-8` between major blocks |
| Card padding       | `p-5`–`p-6`                    |
| Stack inside cards | `space-y-3`–`space-y-4`        |

## Typography

- **Page / panel titles** — `text-lg font-semibold tracking-tight text-foreground`
- **Eyebrow / labels** — `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`
- **Body** — `text-sm text-muted-foreground` with `leading-relaxed` for paragraphs
- **Mono (DNS)** — `text-xs font-mono` in `bg-muted` wells

Font stacks come from `tailwind.config.ts` (`font-sans`, `font-serif` for marketing only).

## Color & surfaces

- Use semantic tokens: `background`, `foreground`, `card`, `border`, `muted`, `primary`, `destructive`.
- **Success / live** — `emerald-600` / `emerald-500` for primary success buttons and completed step checkmarks.
- **Cards** — `rounded-xl border border-border/80 bg-card shadow-sm` or `shadow-[0_1px_0_rgba(0,0,0,0.04)]` in light mode.

## Components

- **Buttons** — `components/ui/button.tsx` (`Button`): `default` for primary on-brand, `cta` / emerald for high-intent actions, `outline` for secondary, `ghost` for toolbar actions.
- **Badge** — `components/ui/badge.tsx` for small status chips (e.g. “Training”, “DNS”).
- **Card** — `components/ui/card.tsx` for “Next step”, settings blocks, and preview framing.

## Layout (desktop dashboard)

1. **Top bar** — Minimal app header (brand + dashboard label + notifications, theme, user). No decorative browser dots.
2. **Stepper row** — Full width, max `max-w-7xl mx-auto`, horizontal steps with **icons**, connector lines, and clear current vs complete states.
3. **Context line** — Single sentence under the stepper (“Next: …”) — no duplicate CTAs here.
4. **Body** — Flex row:
   - **Sidebar** (~15rem expanded): nav, scan sites, footer stats, collapse control. Background `bg-sidebar` / `border-sidebar-border`.
   - **Work area** (~40–45% at `xl`): scrollable column with toasts, **Next step** card, then Training / Design / Domain content.
   - **Preview** (remaining ~55–60% at `xl`): large framed widget, device toggles, optional demo conversation in `CustomerChat`.

Below `xl`, preview stacks or shares space per existing `lg` rules.

## Motion

- Prefer CSS transitions on `colors`, `shadow`, `opacity` (150–200ms).
- Keep Framer Motion for existing cart CTA pulse only unless expanding deliberately.

## Accessibility

- Icon-only controls need `aria-label`.
- Stepper steps should be readable in order; current step uses `aria-current="step"` where applicable.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring` (via `Button`).

## Future

- Add `components/ui/separator.tsx` and `components/ui/tabs.tsx` if panels grow further.
- Consider `scroll-area` for long DNS / log content.
