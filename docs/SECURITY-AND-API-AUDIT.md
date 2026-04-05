# ForwardSlash.Chat — Security & API Audit

> **Last updated:** April 2026  
> Use this doc to audit endpoints, enforce auth, and track security fixes.

---

## 1. Middleware Protection

| Route pattern | Protected? | Notes |
|---------------|------------|-------|
| `/dashboard(.*)` | ✅ Yes | `auth.protect()` — requires Clerk session |
| `/fs-ops(.*)` | ✅ Yes | `auth.protect()` |
| `/api/*` | ❌ No | **API routes are NOT protected by middleware.** Each route must enforce its own auth. |
| `/`, `/chat/demo`, `/checkout`, `/services`, `/thank-you`, `/sign-in`, `/sign-up` | Public | Intended |

**Important:** Middleware performs **host → customer rewrite** for custom chat domains by calling `GET /api/chat/resolve-by-host` (see `middleware.ts`). Visitor IP is forwarded (`x-forwarded-for` / `x-vercel-forwarded-for`) so per-IP rate limits apply correctly.

---

## 2. API Endpoint Audit

### Auth required (Clerk `getOrCreateUser`)

| Endpoint | Method | Auth | Ownership / notes |
|----------|--------|------|-------------------|
| `/api/dashboard` | GET | ✅ | Order claim if `userId` null (UUID in URL); 404 if owned by another user |
| `/api/orders/me` | GET | ✅ | User’s orders only |
| `/api/orders/[id]` | GET, DELETE | ✅ | `order.userId === user.userId` |
| `/api/orders` | POST | ✅ | **Admin only** (`ADMIN_EMAILS`) — legacy/manual order create |
| `/api/credits`, `/api/credits/checkout` | GET/POST | ✅ | User-scoped |
| `/api/customers/[id]` | PATCH | ✅ | Customer → order ownership |
| `/api/customers/[id]/crawl` | POST | ✅ | Order ownership + payment |
| `/api/customers/[id]/go-live` | GET, POST | ✅ | Order ownership |
| `/api/customers/by-order/[orderId]` | GET | ✅ | Order ownership |
| `/api/scan-request` | POST | ✅ | Authenticated |
| `/api/admin/*` | GET/POST | ✅ | `ADMIN_EMAILS` |

### Webhooks & cron (secrets / signatures)

| Endpoint | Verification |
|----------|----------------|
| `/api/webhooks/stripe` | Stripe signature |
| `/api/webhooks/clerk` | Clerk `verifyWebhook` |
| `/api/webhooks/resend` | Resend signing secret (if configured) |
| `/api/cron/*` | `Authorization: Bearer CRON_SECRET` |

### Public (by design)

| Endpoint | Notes |
|----------|--------|
| `/api/scan` | Firecrawl cost; consider stricter rate limits / URL checks |
| `/api/scan/roast` | Validated URL |
| `/api/chat` | **Rate limit per `customerId`** (`CHAT_RATE_LIMIT_PER_MINUTE`); paid order required for chat |
| `/api/chat/demo` | Demo-specific rate limits (see env in `DEVELOPER-GUIDE.md`) |
| `/api/chat/customer/[customerId]` | **Minimal fields** (businessName, primaryColor) for widget UI |
| `/api/chat/resolve-by-host` | **Rate limit per IP** (`RESOLVE_HOST_RATE_LIMIT_PER_MINUTE`, default 60); returns `customerId` for host — abuse mitigation |
| `/api/checkout/stripe` | **Server-computed** `amountCents` via `computeCheckoutAmountCents`; sanitized inputs |
| `/api/checkout/lead`, `/api/checkout/visit` | Validated leads / visits |
| `/api/email` | **`EMAIL_API_SECRET`** required |
| `/api/version` | Non-sensitive build metadata (env names only; no secrets) |

---

## 3. Known product / threat-model notes

- **Unclaimed orders:** If `orders.user_id` is null, first signed-in user who loads `/api/dashboard?orderId=` **claims** the order. Mitigated by unguessable UUIDs; do not share checkout success URLs publicly.
- **`GET /api/chat/resolve-by-host`:** Reveals whether a host maps to a tenant (`customerId`). Rate limiting reduces enumeration; hostnames are often discoverable anyway via DNS.

---

## 4. Input Validation

| Area | Location |
|------|----------|
| Checkout | `sanitizeBusinessName`, `sanitizeDomain`, `sanitizeWebsiteUrl`, `isValidPlanSlug`, server pricing |
| Leads / demo | `lib/validation.ts` |
| Chat | `sanitizeChatMessage` |

**Residual gaps (low priority):** stricter UUID validation on some `customerId` query params; additional `/api/scan` rate limits by IP.

---

## 5. Sensitive Data

| Data | Exposure |
|------|----------|
| Stripe / DB / OpenAI keys | Env only, never client |
| User emails | Not exposed on public chat metadata routes |

---

## 6. Action Items (rolling)

| Status | Item |
|--------|------|
| ✅ | `GET /api/orders/[id]`, `GET /api/customers/by-order/...` — auth + ownership |
| ✅ | `POST /api/email` — `EMAIL_API_SECRET` |
| ✅ | `POST /api/orders` — admin-only |
| ✅ | `/api/chat` — per-customer rate limit |
| ✅ | `/api/checkout/stripe` — server-side amount |
| ✅ | `/api/chat/resolve-by-host` — per-IP rate limit + middleware IP forward |
| ⏳ | `/api/scan` — optional per-IP rate limit (Firecrawl cost) |
| ⏳ | Unclaimed-order claim — optional signed token from checkout success (future) |

---

## 7. References

- [TECH-SPEC.md](./TECH-SPEC.md) — Stack, schema, API list
- [lib/validation.ts](../lib/validation.ts)
- [middleware.ts](../middleware.ts)
