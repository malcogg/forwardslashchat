# Maintenance, Upgrades & Dependencies — ForwardSlash.Chat

**Last updated:** April 2026  
**Audience:** Engineers maintaining the repo after handoff.

---

## 1. Dependency policy

| Principle | Detail |
|-----------|--------|
| **Pin major versions** in `package.json` with caret (`^`) only where semver is trusted; **run `npm run build`** after every major bump. |
| **Security** | Use `npm audit`, GitHub Dependabot (if enabled), and Vulnerability alerts on the repo. |
| **Lockfile** | Commit `package-lock.json`; CI/build should use `npm ci` in pipelines if you add CI. |

---

## 2. Core stack — what to upgrade and how often

| Package | Role | Upgrade notes |
|---------|------|-----------------|
| **next** | Framework | Follow [Next.js upgrade guides](https://nextjs.org/docs/app/building-your-application/upgrading); check App Router breaking changes, `middleware` matcher, `next/image`. |
| **react** / **react-dom** | UI | Keep aligned with Next’s supported React version. |
| **@clerk/nextjs** | Auth | Check Clerk migration guides; test sign-in, `/dashboard`, webhooks if used. |
| **drizzle-orm** / **drizzle-kit** | DB | Run `db:generate` / migrations carefully; verify `db/schema.ts` against Neon. |
| **@neondatabase/serverless** | DB driver | Test connection pooling and serverless timeouts after bump. |
| **stripe** | Payments | Stripe API version pinned in dashboard; test Checkout + webhook with Stripe CLI. |
| **ai** / **@ai-sdk/openai** | LLM | Vercel AI SDK moves quickly; verify `streamText`, `useChat`, `toDataStreamResponse` APIs. |
| **tailwindcss** | CSS | Major bumps may change `tailwind.config` / content globs. |
| **eslint** / **eslint-config-next** | Lint | Usually bump with Next major. |

---

## 3. External services (operational upgrades)

| Service | What to rotate / review |
|---------|-------------------------|
| **Neon** | Connection limits, branching for staging, PITR if enabled. |
| **OpenAI** | Model deprecations; `gpt-4o-mini` replacement path if renamed. |
| **Firecrawl** | API changes, credit limits (`FIRECRAWL_*` env in schema). |
| **Resend** | Domain verification, sending reputation. |
| **Vercel** | Node runtime, cron limits, Edge vs Node for routes. |
| **Stripe** | Webhook endpoint URL on domain changes; API version. |

---

## 4. Database migrations

- **Drizzle:** `npm run db:push` for dev; production should use reviewed migrations — see [SETUP-DATABASE-MIGRATIONS.md](./SETUP-DATABASE-MIGRATIONS.md).
- **Hand-written SQL:** `docs/migrations/*.sql` — naming `NNN-description.sql`; apply in order in Neon for production.

**Recent additions:** `016-demo-chat-leads.sql` — `demo_chat_leads` for `/chat/demo` lead capture.

---

## 5. Tech debt hotspots (for planning)

- **RAG:** Customer chat is stuffing, not embeddings; see [CHAT-CONTEXT.md](./CHAT-CONTEXT.md) and `TODO.md`.
- **Demo hardcoded keywords** in `app/chat/demo/page.tsx` — must stay loosely aligned with [pricing-and-bundles.md](./pricing-and-bundles.md) when pricing changes.
- **Multiple doc sources** — [docs/README.md](./README.md) indexes them; prefer updating **TECH-SPEC** + **DEVELOPER-GUIDE** when behavior changes.

---

## 6. Release checklist (suggested)

1. `npm run build` && `npm run lint` locally.  
2. Run migrations on staging/production DB.  
3. Deploy Vercel; verify `GET /api/version` or deploy SHA if you use it.  
4. Smoke: home, `/chat/demo`, Stripe test mode path, one crawl, one chat message.  
5. Monitor Stripe webhook delivery and OpenAI error rates after deploy.
