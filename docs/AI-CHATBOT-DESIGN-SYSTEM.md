# ForwardSlash.Chat - AI Chatbot Design System

We've adopted the design system from the [Vercel Next.js AI Chatbot](https://vercel.com/templates/next.js/nextjs-ai-chatbot) template so our UI matches its look and feel.

## What We Adopted

- **Fonts**: Geist Sans + Geist Mono (via `next/font/google`)
- **Theme**: Light/dark mode with `next-themes` (system default)
- **Design tokens**: Same CSS variables (`--background`, `--foreground`, `--muted`, `--primary`, `--border`, `--sidebar`, etc.)
- **Colors**: Semantic classes (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, etc.)
- **Theme toggle**: In sidebar Guest section ("Toggle dark mode")
- **Scrollbars**: Minimal 6px style
- **Border radius**: `--radius` variable

## Forking the Full Template

To start from the exact template and adapt it:

1. **Fork on GitHub**: Go to [github.com/vercel/ai-chatbot](https://github.com/vercel/ai-chatbot) → Fork
2. **Clone your fork**: `git clone https://github.com/YOUR_USER/ai-chatbot forwardslash`
3. **Replace their flow** with ours:
   - Main page: Chat input → URL input + Scan
   - Sidebar: Chat history → Demo + scanned sites
   - Add our ScanModal, InfoModal, pricing flow
   - Add Firecrawl integration
4. **Keep**: Their auth (NextAuth), DB (Neon), AI SDK, sidebar UI components
5. **Add**: Our fulfillment logic, Resend emails, customer chat routing

This gives you their exact components and structure. We chose to **adapt** our existing codebase instead of forking, so we could keep our scan/pricing flow while matching their visual design.

## Packages Added

- `next-themes` – Theme switching
- `tailwindcss-animate` – Smoother transitions

Run `npm install` to install.
