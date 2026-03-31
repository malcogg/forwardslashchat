# ForwardSlash.Chat — Security & API Audit

> **Last updated:** February 2026  
> Use this doc to audit endpoints, enforce auth, and track security fixes.

---

## 1. Middleware Protection

| Route pattern | Protected? | Notes |
|---------------|------------|-------|
| `/dashboard(.*)` | ✅ Yes | `auth.protect()` — requires Clerk session |
| `/admin(.*)` | ✅ Yes | `auth.protect()` |
| `/api/*` | ❌ No | **API routes are NOT protected by middleware.** Each route must enforce its own auth. |
| `/`, `/chat/demo`, `/checkout`, `/sign-in`, `/sign-up` | Public | Intended |

**Important:** Middleware only protects page routes (`/dashboard`, `/admin`). All `/api/*` endpoints rely on route-level auth.

---

## 2. API Endpoint Audit

### Auth required (Clerk `getOrCreateUser`)

| Endpoint | Method | Auth | Ownership | Validation | Status |
|----------|--------|------|-----------|------------|--------|
| `/api/dashboard` | GET | ✅ | Order claim/ownership | orderId param | ✅ Secure |
| `/api/orders/me` | GET | ✅ | User's orders only | — | ✅ Secure |
| `/api/orders/[id]` | GET | ✅ | `order.userId === user.userId` | — | ✅ Secure |
| `/api/orders/[id]` | DELETE | ✅ | `order.userId === user.userId` | — | ✅ Secure |
| `/api/scan-request` | POST | ✅ | — | url, estimatedPages | ✅ Secure |
| `/api/credits` | GET | ✅ | User's credits | — | ✅ Secure |
| `/api/customers/[id]` | PATCH | ✅ | Order → customer ownership | status enum | ✅ Secure |
| `/api/customers/[id]/crawl` | POST | ✅ | Order ownership, payment check | — | ✅ Secure |
| `/api/admin/orders` | GET | ✅ Admin | ADMIN_EMAILS | — | ✅ Secure |
| `/api/admin/orders` | POST | ✅ Admin | ADMIN_EMAILS | websiteUrl, businessName, domain | ✅ Secure |

### Public (no auth)

| Endpoint | Method | Validation | Risk | Status |
|----------|--------|------------|------|--------|
| `/api/scan` | POST | url (basic) | Firecrawl credit abuse, SSRF | ⚠️ Consider rate limit, URL allowlist |
| `/api/scan/roast` | POST | url via `isValidUrl`, `sanitizeWebsiteUrl` | SSRF mitigated by validation | ✅ OK |
| `/api/chat/customer/[customerId]` | GET | customerId (UUID) | Info disclosure: businessName, primaryColor (low) | ✅ OK by design |
| `/api/chat` | POST | customerId, messages, `sanitizeChatMessage` | LLM abuse, no rate limit | ⚠️ Consider rate limit |
| `/api/chat/demo` | POST | messages | LLM abuse, no rate limit | ⚠️ Consider rate limit |
| `/api/checkout/lead` | POST | Full validation (lib/validation) | — | ✅ Secure |
| `/api/checkout/stripe` | POST | amountCents, bundleYears, businessName, domain, websiteUrl | Client can set amount — Stripe enforces payment | ⚠️ Add amount range check if needed |
| `/api/chat/customer/[customerId]` | GET | — | Public by design | ✅ OK |

### Unauthenticated — potential abuse

| Endpoint | Method | Issue | Recommendation |
|----------|--------|-------|----------------|
| ~~`/api/orders/[id]`~~ | GET | ~~Returns order to anyone with ID~~ | ✅ Fixed — auth + ownership |
| ~~`/api/customers/by-order/[orderId]`~~ | GET | ~~Returns full customer to anyone with orderId~~ | ✅ Fixed — auth + ownership |
| ~~`/api/email`~~ | POST | ~~Open relay~~ | ✅ Fixed — requires `Authorization: Bearer EMAIL_API_SECRET` |
| `/api/orders` | POST | Anyone can create orders (no auth) | If only used internally, add API key or restrict to webhooks |

### Webhooks (signature verification)

| Endpoint | Method | Verification | Status |
|----------|--------|---------------|--------|
| `/api/webhooks/stripe` | POST | `Stripe.webhooks.constructEvent` | ✅ Secure |
| `/api/webhooks/clerk` | POST | `verifyWebhook` (Clerk) | ✅ Secure |

### Cron (secret-based)

| Endpoint | Method | Verification | Status |
|----------|--------|---------------|--------|
| `/api/cron/payment-reminder` | GET | `Authorization: Bearer CRON_SECRET` | ✅ Secure |

---

## 3. Auth & User Blocking

- **Fake emails:** `unknown@example.com` (and similar placeholders) are blocked in `lib/auth.ts` via `getOrCreateUser()`. Users with fake emails cannot access protected APIs.
- **Clerk config:** Consider requiring verified email in Clerk Dashboard to prevent email-less sign-up at the source.

---

## 4. Input Validation

| Source | Used in | Functions |
|--------|---------|-----------|
| `lib/validation.ts` | checkout/lead, admin, scan/roast | `sanitizeFirstName`, `sanitizeEmail`, `isValidEmail`, `sanitizeWebsiteUrl`, `isValidUrl`, `sanitizeChatMessage`, etc. |
| `LIMITS` | All sanitizers | Character limits (OWASP-style) |

**Validation gaps:**
- `/api/scan` — URL normalized but not validated via `isValidUrl` / `sanitizeWebsiteUrl`
- `/api/chat` — `customerId` not validated as UUID (Drizzle will no-op on bad ID)
- `/api/checkout/stripe` — `businessName`, `domain`, `websiteUrl` not sanitized (passed through)
- `/api/orders` — No sanitization on businessName, domain, websiteUrl

---

## 5. Sensitive Data

| Data | Storage | Exposure |
|------|---------|----------|
| Stripe keys | Env only | Never in client |
| Clerk keys | Env only | Publishable key is public by design |
| Database URL | Env only | Never in client |
| User emails | `users` table | Not returned to chat/customer APIs |
| Order/customer | `orders`, `customers` | Auth required on GET orders/[id], customers/by-order |

---

## 6. Action Items (Priority Order)

| Priority | Issue | Action |
|----------|-------|--------|
| ~~**P0**~~ | ~~`GET /api/orders/[id]` — no auth~~ | ✅ Fixed |
| ~~**P0**~~ | ~~`GET /api/customers/by-order/[orderId]` — no auth~~ | ✅ Fixed |
| ~~**P0**~~ | ~~`POST /api/email` — open relay~~ | ✅ Fixed — `EMAIL_API_SECRET` required |
| **P1** | `POST /api/orders` — unauthenticated create | Add API key or restrict to webhook/internal |
| **P2** | `/api/scan` — Firecrawl abuse | Add rate limiting (Vercel or Upstash) |
| **P2** | `/api/chat`, `/api/chat/demo` — LLM abuse | Add rate limiting |
| **P2** | `/api/checkout/stripe` — amount manipulation | Validate amountCents against allowed tiers |
| **P3** | `/api/scan` — URL validation | Use `sanitizeWebsiteUrl` + `isValidUrl` |
| **P3** | `/api/checkout/stripe`, `/api/orders` — sanitization | Apply `sanitizeBusinessName`, `sanitizeDomain`, `sanitizeWebsiteUrl` |

---

## 7. References

- [TECH-SPEC.md](./TECH-SPEC.md) — Stack, schema, API list
- [lib/validation.ts](../lib/validation.ts) — Validation helpers
- [middleware.ts](../middleware.ts) — Route protection

---

## 8. Docs Gap Analysis (What's Missing)

| Gap | Current state | Recommendation |
|-----|---------------|----------------|
| **PRODUCTION-READINESS-CHECKLIST.md** | Outdated — Auth, Payments, Data Storage listed as TODO | Update to reflect current state or archive |
| **TECH-SPEC API reference** | Missing: scan-request, scan/roast, checkout/lead, email, customers/by-order | Add missing endpoints to Section 4 |
| **Docs index** | No single nav — 29 files, hard to discover | Create `docs/README.md` or `DOCS-INDEX.md` with categorized links |
| **Env vars** | Scattered across TECH-SPEC, APP-OVERVIEW, BACKEND-SETUP | Single `ENV-REFERENCE.md` with required/optional, purpose, where used |
| **Deployment / CI** | Not documented | Add Vercel deploy steps, branch strategy, env setup |
| **Runbook / Incident** | None | Add basic runbook: webhook failure, cron failure, DB issues |
| **Changelog** | PROJECT-UPDATES exists but may be ad-hoc | Consider conventional changelog or keep PROJECT-UPDATES current |
