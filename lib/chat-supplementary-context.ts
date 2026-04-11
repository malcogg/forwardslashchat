import type { CrawledPageForChat } from "@/lib/chat-context";

type CustomerProfileFields = {
  businessName: string;
  websiteUrl: string;
  domain: string;
  subdomain: string;
  welcomeMessage: string | null;
};

type ProductRow = {
  title: string;
  price: string | null;
  productUrl: string | null;
  description: string | null;
};

type BlogRow = {
  title: string;
  excerpt: string | null;
  url: string | null;
  date: string | null;
};

function publicHttpsUrl(raw: string): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  try {
    const u = t.startsWith("http://") || t.startsWith("https://") ? new URL(t) : new URL(`https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Fixed context every customer chat sees: who they are, official site, optional welcome copy.
 * Helps vague questions ("what is this about?") even when vector retrieval is narrow.
 */
export function buildCompanyProfileSection(customer: CustomerProfileFields): string {
  const lines: string[] = ["## Company profile (authoritative)"];
  lines.push(`**Business name:** ${customer.businessName}`);

  const site = publicHttpsUrl(customer.websiteUrl);
  if (site) {
    lines.push(`**Official website:** ${site}`);
    lines.push(
      `Direct visitors to this URL if they need the latest information or something is not covered below.`
    );
  }

  if (customer.domain?.trim()) {
    const sub = customer.subdomain?.trim() || "chat";
    lines.push(`**Chat hostname pattern:** ${sub}.${customer.domain} (visitor may be chatting from this domain).`);
  }

  if (customer.welcomeMessage?.trim()) {
    lines.push(`**Message from the business:** ${truncate(customer.welcomeMessage.trim(), 1200)}`);
  }

  return lines.join("\n");
}

/**
 * Dashboard-curated products and blog highlights (same data as rich cards), as markdown for the LLM.
 */
export function buildCuratedCatalogSection(products: readonly ProductRow[], posts: readonly BlogRow[]): string {
  const parts: string[] = [];

  if (products.length) {
    const lines = ["## Products & services (curated)"];
    for (const p of products) {
      const bits = [`- **${p.title}**`];
      if (p.price?.trim()) bits.push(` — ${p.price.trim()}`);
      if (p.productUrl?.trim()) bits.push(` — ${p.productUrl.trim()}`);
      if (p.description?.trim()) bits.push(`\n  ${truncate(p.description.trim(), 400)}`);
      lines.push(bits.join(""));
    }
    parts.push(lines.join("\n"));
  }

  if (posts.length) {
    const lines = ["## Blog & articles (curated highlights)"];
    for (const b of posts) {
      const bits = [`- **${b.title}**`];
      if (b.date?.trim()) bits.push(` (${b.date.trim()})`);
      if (b.url?.trim()) bits.push(` — ${b.url.trim()}`);
      if (b.excerpt?.trim()) bits.push(`\n  ${truncate(b.excerpt.trim(), 350)}`);
      lines.push(bits.join(""));
    }
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n");
}

/**
 * Compact sitemap from crawled pages so the model knows which URLs exist (blogs, guides, etc.).
 */
export function buildCrawledPageIndexSection(
  rows: readonly CrawledPageForChat[],
  maxChars: number
): string {
  if (!rows.length || maxChars < 80) return "";

  const sorted = [...rows].sort((a, b) => {
    const ta = a.createdAt.getTime();
    const tb = b.createdAt.getTime();
    if (ta !== tb) return ta - tb;
    return (a.url ?? "").localeCompare(b.url ?? "");
  });

  const header = "## Pages crawled from the website (index)\nUse these URLs when pointing visitors to blog posts, guides, or specific topics. Full text appears in excerpts below.\n\n";
  let used = header.length;
  const lines: string[] = [header];

  for (const r of sorted) {
    const title = (r.title?.trim() || "Page").replace(/\s+/g, " ");
    const line = `- **${title}** — ${r.url}\n`;
    if (used + line.length > maxChars) {
      lines.push(`\n… and more pages not listed here (see excerpts below).\n`);
      break;
    }
    lines.push(line);
    used += line.length;
  }

  return lines.join("");
}

export function buildCustomerChatSupplementaryContext(input: {
  customer: CustomerProfileFields;
  contentRows: readonly CrawledPageForChat[];
  products: readonly ProductRow[];
  posts: readonly BlogRow[];
  /** Total character budget for this entire supplementary block (profile + curated + index). */
  budgetChars: number;
}): string {
  const budget = Math.max(2000, Math.min(50_000, input.budgetChars));

  let remaining = budget;
  const sections: string[] = [];

  const profile = buildCompanyProfileSection(input.customer);
  if (profile.length <= remaining) {
    sections.push(profile);
    remaining -= profile.length + 20;
  } else {
    sections.push(truncate(profile, Math.floor(remaining * 0.9)));
    remaining = 0;
  }

  if (remaining > 400) {
    const curated = buildCuratedCatalogSection(input.products, input.posts);
    if (curated) {
      const take = Math.min(curated.length, Math.floor(remaining * 0.45));
      sections.push(
        curated.length <= take ? curated : `${truncate(curated, take)}\n\n… (curated list truncated)\n`
      );
      remaining -= Math.min(curated.length, take) + 20;
    }
  }

  if (remaining > 600) {
    const index = buildCrawledPageIndexSection(input.contentRows, remaining);
    if (index) sections.push(index);
  }

  return sections.filter(Boolean).join("\n\n---\n\n");
}
