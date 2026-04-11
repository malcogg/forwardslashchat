# Platform gaps vs full chatbot platforms

ForwardSlash.Chat ships **hands-off delivery**: Stripe → crawl → DNS → go-live → hosted chat, with **context stuffing** into the model today (see `docs/CHAT-CONTEXT.md`). **P2 RAG** (TODO §6) will improve retrieval at scale.

This doc lists gaps vs typical “full” chatbot SaaS (Intercom-style, Chatbase, etc.). **Priority is decided product strategy**, not “everything is optional.”

**Authoritative prioritization:** `docs/PRODUCTION-READINESS-CHECKLIST.md` §5 (bands A / B / C + coming soon) and **`TODO.md` §7** (same items as checkboxes).

---

## Strategic bands (summary)

| Band | Theme | Examples |
|------|--------|----------|
| **A** | Owners expect this soon after buying | Persisted **chat logs**, **messages** UI, **analytics v1** |
| **A² / parallel** | **Founder vision** (**shipped** Apr 2026) | Slash shortcuts + **`customer_chat_leads`** + dashboard summary — see **`CUSTOMER-CHAT-VISITOR-FEATURES.md`** |
| **B** | Upsell | **Extra knowledge** (PDF, FAQs, facts) — charge separately |
| **C** | High value, phased | **Human handoff**, **visitor identity** + privacy |
| **Coming soon** | Roadmap, honest marketing | **Prompt A/B**, **multi-channel** (WhatsApp/SMS) |

---

## Chat experience & data

| Gap | Notes |
|-----|--------|
| **Persisted chat logs** | Required for trust, support, and owner visibility. Needs schema, retention, export/delete, policy updates. |
| **RAG / vector retrieval** | Today: capped stuffing. Target: chunking + embeddings + top-k (TODO §6 **P2 RAG**). |
| **Knowledge beyond crawl** | PDFs, manual FAQs, structured facts — **Band B**, best with RAG; **monetize**. |

## Owner / operator

| Gap | Notes |
|-----|--------|
| **Messages + analytics** | **Band A**: inbox-style UI + events (volume, optional thumbs); richer BI later. |
| **Human handoff** | **Band C**: email/Slack + transcript first; CRM APIs later. |
| **Prompt A/B** | **Coming soon**: versions, buckets, outcome logging. |

## Visitor / growth

| Gap | Notes |
|-----|--------|
| **Visitor identity** | **Band C**: optional email in widget, session stitching, CRM export, consent. |
| **Multi-channel** | **Coming soon**: same brain, new ingress (Meta/Twilio, etc.). |

## Already strong here

- **Crawl → DNS → go-live** automation and dashboard milestones.
- **DNS self-check**: full go-live job + `GET .../go-live?dnsProbe=1` for read-only CNAME probe.
- **Email** map: `docs/EMAIL-TRIGGERS-AND-DRAFTS.md` (Stripe payment email, milestones, reminders).

---

## Related docs

- `docs/PRODUCTION-READINESS-CHECKLIST.md` §4–§6 — P2 RAG, rich cards, post-launch order
- `TODO.md` §6–§9 — RAG, owner experience, ops, differentiation
- `docs/CHAT-CONTEXT.md` — current stuffing semantics
