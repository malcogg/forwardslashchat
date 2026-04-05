# Platform gaps vs full chatbot platforms

ForwardSlash.Chat today optimizes for **hands-off delivery**: Stripe → crawl → DNS → go-live, with **context stuffing** into the model (see `docs/CHAT-CONTEXT.md`) rather than a full retrieval stack.

This doc tracks **parity gaps** vs typical “full” chatbot SaaS (Intercom-style bots, Chatbase, etc.). Items are **not** commitments—prioritize with product.

---

## Chat experience & data

| Gap | Notes |
|-----|--------|
| **Persisted chat logs** | Today: ephemeral or session-only per deployment choice. Full platforms store history for compliance, replay, and training. Needs: schema, retention, GDPR/export story. |
| **RAG / vector retrieval** | Today: capped text stuffing from crawled pages. Full platforms: chunking, embeddings, top-k retrieval (see TODO **B — P2 RAG**). |
| **Knowledge beyond crawl** | Upload PDFs, manual FAQs, structured entities—optional layer on top of crawl. |

## Owner / operator

| Gap | Notes |
|-----|--------|
| **Analytics dashboard** | Conversations, drop-off, popular intents, resolution—usually requires persisted logs + event pipeline. |
| **Human handoff** | Route to inbox, Zendesk, Slack when the bot fails or user asks. |
| **A/B or prompt versioning** | Test system prompts and measure outcomes. |

## Visitor / growth

| Gap | Notes |
|-----|--------|
| **Known visitor identity** | Email capture in-widget, merge with CRM; optional cookies for “returning visitor.” |
| **Multi-channel** | Same brain on web widget, WhatsApp, SMS—separate surface area. |

## Already strong here

- Automated **crawl → DNS → go-live** pipeline and dashboard milestones.
- **DNS self-check**: full go-live job plus read-only `GET .../go-live?dnsProbe=1` for CNAME verification without attaching.
- **Email** inventory in `docs/EMAIL-TRIGGERS-AND-DRAFTS.md` (includes Stripe **Payment received** Resend + optional `SKIP_PAYMENT_RECEIVED_EMAIL`).

---

## Related docs

- `TODO.md` — section **7 — Moving forward: platform parity** mirrors this list as checkboxes.
- `docs/CHAT-CONTEXT.md` — current stuffing semantics.
- `docs/EMAIL-TRIGGERS-AND-DRAFTS.md` — transactional email map.
