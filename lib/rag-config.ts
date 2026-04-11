/** Env-driven knobs for customer-chat RAG (pgvector + OpenAI embeddings). */

const truthy = (v: string | undefined) => /^(1|true|yes|on)$/i.test(String(v ?? "").trim());

export function resolveChatUseRag(): boolean {
  const raw = process.env.CHAT_USE_RAG;
  if (raw === undefined || raw === "") return true;
  return truthy(raw);
}

export function resolveChatRagTopK(): number {
  const raw = Number(process.env.CHAT_RAG_TOP_K ?? 8);
  if (!Number.isFinite(raw)) return 8;
  return Math.min(24, Math.max(1, Math.round(raw)));
}

/** Max chunk body length (characters). */
export function resolveChatRagChunkChars(): number {
  const raw = Number(process.env.CHAT_RAG_CHUNK_CHARS ?? 2000);
  if (!Number.isFinite(raw)) return 2000;
  return Math.min(8000, Math.max(400, Math.round(raw)));
}

/** Overlap between consecutive chunks (characters). */
export function resolveChatRagChunkOverlap(): number {
  const raw = Number(process.env.CHAT_RAG_CHUNK_OVERLAP ?? 300);
  if (!Number.isFinite(raw)) return 300;
  return Math.min(2000, Math.max(0, Math.round(raw)));
}

export function resolveChatRagEmbeddingModel(): string {
  return (process.env.CHAT_RAG_EMBEDDING_MODEL ?? "text-embedding-3-small").trim() || "text-embedding-3-small";
}

/**
 * Second retrieval query to surface overview / blog / topic pages when the user message is short or vague.
 * Set `CHAT_RAG_AUGMENT_QUERY=0` to disable (saves one embedding batch).
 */
export function resolveChatRagAugmentQueryText(): string | null {
  const raw = process.env.CHAT_RAG_AUGMENT_QUERY;
  if (raw === "0" || raw?.toLowerCase() === "false" || raw?.toLowerCase() === "off") {
    return null;
  }
  if (raw?.trim()) return raw.trim().slice(0, 2000);
  return "Company overview, what this site offers, mission, services, products, pricing, blog posts, articles, guides, fees and costs, how-to content, FAQ, contact and support.";
}
