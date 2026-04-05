# ForwardSlash.Chat — dashboard design system (compact desktop)

Visual language for the **desktop dashboard** (≥1280px `xl` breakpoint). Goals: **low cognitive load**, **one pay/checkout path per screen**, and **dense but readable** layouts inspired by Linear / Vercel — not empty, but efficient.

## Core principles

1. **Single dominant checkout action** — If the **Next step** card shows “Complete payment”, do not repeat full-width pay buttons in Training or a pulsing sidebar CTA for the same flow. Use at most one text link elsewhere (“Open cart” for multi-site bundles).
2. **Compact vertical rhythm** — Stepper + context should fit in **~72–96px** total height (excluding borders). Prefer tighter `py-3` / `py-4` over `py-8`.
3. **Work column first** — At `xl`, the **left** column is **~55–60%** for next step + panels; the **right** column is **~40–45%** for live preview (polished frame, not necessarily the widest column).
4. **Status at a glance** — Crawled/pages use **pills** (`Badge`) or small inline stats, not large red numbers unless something is wrong.
5. **Progress truth** — Step labels match state (“Complete payment” until paid, then “Payment received”).

## Spacing (compact)

| Use | Tailwind / value |
|-----|------------------|
| App header height | `h-12` (48px) |
| Stepper strip | `py-3`, gap `gap-2` between step clusters |
| Main column padding | `p-4 md:p-5 xl:p-6` |
| Stack between cards | `space-y-4`–`space-y-5` (not `space-y-8`) |
| Card internal | `p-4`, headers `pb-2` |
| Sidebar | `w-56` expanded; nav `py-1.5` rows |

## Typography

- **Card title** — `text-base font-semibold tracking-tight`
- **Eyebrow** — `text-[10px] uppercase tracking-wider text-muted-foreground font-semibold`
- **Body** — `text-sm text-muted-foreground leading-snug` (avoid long paragraphs; prefer bullets or one line)
- **Mono / DNS** — `text-xs font-mono` in `rounded-md bg-muted/80 px-2 py-1.5`

## Surfaces

- Cards: `rounded-lg border border-border/70 bg-card shadow-sm`
- Subtle hover: `hover:border-border hover:shadow-md transition-shadow duration-200`
- Primary CTA: `Button` default or `variant="cta"` (emerald) — **one per viewport region** (next card OR sidebar bundle, not both for the same intent)

## Stepper

- Icon cells: `h-9 w-9 rounded-lg` (not `h-11` / heavy rings)
- Connectors: `h-0.5`, `mt-[18px]` aligned to icon center
- Current: small `text-[9px] uppercase text-primary` under label, or badge inline — avoid duplicating a full sentence below the whole stepper

## Layout recap

```
[Header: logo · nav · PRO · bell · avatar]
[Compact stepper row — full width, max-w-7xl]
[Sidebar |  Work column (~58%)  |  Preview (~42%) ]
```

## Components

- `components/ui/button.tsx`, `card.tsx`, `badge.tsx` — prefer `size="sm"` for secondary; `default`/`lg` for the single primary action in a card.
- `DesktopStepper`, `DesktopNextStepCard` — tuned for compact spacing; copy stays short.

## Accessibility

- Keep `aria-current="step"` on the active step.
- Don’t remove focus rings; compact ≠ invisible focus.

## Mobile

Unchanged shell (`md:hidden`); this doc applies to **`hidden md:flex`** desktop tree only.
