/** Row shape from `content` used when building the stuffed system prompt. */
export type CrawledPageForChat = {
  title: string | null;
  url: string;
  content: string;
  createdAt: Date;
};

/** Default cap on crawled text injected into the system prompt (characters, not tokens). */
export const DEFAULT_CHAT_CONTEXT_MAX_CHARS = 60_000;

/** Default number of recent chat turns sent to the model (after sanitization). */
export const DEFAULT_CHAT_HISTORY_MESSAGES = 12;

/** Default max completion tokens for customer chat (`CHAT_MAX_TOKENS` overrides). */
export const DEFAULT_CHAT_MAX_OUTPUT_TOKENS = 600;

/**
 * Operator override for context budget (RAG excerpts and stuffing). Clamped to avoid absurd prompts or tiny windows.
 */
export function resolveChatContextMaxChars(): number {
  const raw = Number(process.env.CHAT_CONTEXT_MAX_CHARS ?? DEFAULT_CHAT_CONTEXT_MAX_CHARS);
  if (!Number.isFinite(raw)) return DEFAULT_CHAT_CONTEXT_MAX_CHARS;
  return Math.min(120_000, Math.max(8_000, Math.round(raw)));
}

export function resolveChatHistoryMessageLimit(): number {
  const raw = Number(process.env.CHAT_HISTORY_MESSAGES ?? DEFAULT_CHAT_HISTORY_MESSAGES);
  if (!Number.isFinite(raw)) return DEFAULT_CHAT_HISTORY_MESSAGES;
  return Math.min(32, Math.max(2, Math.round(raw)));
}

export function resolveChatMaxOutputTokens(): number {
  const raw = Number(process.env.CHAT_MAX_TOKENS ?? DEFAULT_CHAT_MAX_OUTPUT_TOKENS);
  if (!Number.isFinite(raw)) return DEFAULT_CHAT_MAX_OUTPUT_TOKENS;
  return Math.min(1200, Math.max(128, Math.round(raw)));
}

/**
 * **Stuffing fallback (when RAG is off or returns nothing):** concatenate crawled pages until the character budget is exhausted.
 * Pages are sorted by `createdAt` then `url` so context is stable across requests.
 * If a page would exceed the budget, it is **skipped** (no partial page); earlier pages stay included.
 */
export function buildWebsiteKnowledgeContext(
  rows: readonly CrawledPageForChat[],
  maxChars: number
): { context: string; pageCountIncluded: number; pageCountTotal: number } {
  const sorted = [...rows].sort((a, b) => {
    const ta = a.createdAt.getTime();
    const tb = b.createdAt.getTime();
    if (ta !== tb) return ta - tb;
    return (a.url ?? "").localeCompare(b.url ?? "");
  });

  let used = 0;
  const parts: string[] = [];
  for (const r of sorted) {
    const title = r.title?.trim() || "Page";
    const chunk = `## ${title}\nURL: ${r.url}\n\n${r.content}`;
    if (used + chunk.length > maxChars) break;
    parts.push(chunk);
    used += chunk.length;
  }

  return {
    context: parts.join("\n\n---\n\n"),
    pageCountIncluded: parts.length,
    pageCountTotal: sorted.length,
  };
}
