# ForwardSlash.Chat - Pricing and Bundles

This document defines the official pricing, bundle logic, renewal terms, and
the DNS setup add-on. Use this as the single source of truth for sales pages,
checkout, emails, and internal ops.

Last updated: February 2026

## Core Pricing

All bundles include:

- Custom chatbot trained on the customer's website (plus optional files)
- Branded ChatGPT-style interface
- Hosting and maintenance included for the prepaid period
- Delivery in 3-10 business days
- Customer uses their own subdomain via CNAME

Renewal after the prepaid period is optional at $495/year (price subject to change).

## Bundles (official)

| Bundle         | Price  | Prepaid period | Renewal after | Notes                                   |
|----------------|--------|----------------|---------------|-----------------------------------------|
| 1-Year Starter | $550   | 1 year         | $495/year     | First year hosting/maintenance included |
| 2-Year Bundle  | $850   | 2 years        | $495/year     | Recommended - saves $190                |
| 3-Year Bundle  | $1,250 | 3 years        | $495/year     |                                         |
| 4-Year Bundle  | $1,600 | 4 years        | $495/year     |                                         |
| 5-Year Bundle  | $1,950 | 5 years        | $495/year     | Max upfront cash                        |

Recommended default: 2-Year Bundle ($850).

## Effective Monthly Cost (for positioning)

- 1-Year Starter: $46/month in year one
- 2-Year Bundle: ~$35/month over 2 years
- 3-Year Bundle: ~$35/month over 3 years
- 4-Year Bundle: ~$33/month over 4 years
- 5-Year Bundle: ~$32.50/month over 5 years

## Savings vs Paying Yearly

Assumes paying 1-Year Starter repeatedly at $550 each year.

- 2-Year Bundle: saves $190
- 3-Year Bundle: saves $340
- 4-Year Bundle: saves $530
- 5-Year Bundle: saves $725

## DNS Setup Add-On

- Optional $100 one-time add-on
- We help add the CNAME record with explicit permission or guidance
- If not purchased, customer adds DNS themselves

## Renewal Rules (post-prepaid)

- Renewal is optional at $495/year
- Renewal price is subject to change for future years
- Send renewal reminder ~30 days before prepaid end

## Messaging Notes (customer-facing)

- "One upfront payment, no monthly fees"
- "Hosting and maintenance included for your prepaid period"
- "Renewal is optional after your prepaid term"
- "Recommended: 2-Year Bundle - Save $190"

## Scan -> Tier Mapping (for landing page auto-pricing)

When the user scans their site, page count determines which tier to pre-select in the pricing modal. Customer sees "Your Price" without having to choose.

| Page count | Tier |
|------------|------|
| Under 300 | Small |
| 300-1,000 | Medium |
| 1,000-5,000 | Large |
| 5,000+ | Enterprise (Contact us) |
| Scan failed | Default to Small or "Contact us" |

Each tier maps to the bundles above (1-Year through 5-Year). Default recommendation for Small/Medium: 2-Year Bundle.
