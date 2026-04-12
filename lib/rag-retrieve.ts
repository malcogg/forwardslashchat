import { db } from "@/db";
import { embedTextsOpenAI } from "@/lib/rag-openai";
import { pgVectorLiteral } from "@/lib/rag-pg";
import { resolveChatRagAugmentQueryText, resolveChatRagTopK } from "@/lib/rag-config";
import { sql } from "drizzle-orm";

export type RetrievedChunk = {
  url: string;
  title: string | null;
  body: string;
  /** Cosine distance (pgvector `<=>`); lower is better. */
  distance: number;
};

/**
 * Top-k similar chunks for a query embedding (cosine distance).
 */
export async function retrieveSimilarChunks(
  customerId: string,
  queryEmbedding: readonly number[],
  topK: number
): Promise<RetrievedChunk[]> {
  if (!db) return [];

  const k = Math.max(1, topK);
  const lit = pgVectorLiteral(queryEmbedding);

  const res = await db.execute(sql`
    SELECT url, title, body, embedding <=> ${lit} AS dist
    FROM content_chunks
    WHERE customer_id = ${customerId}
    ORDER BY embedding <=> ${lit}
    LIMIT ${k}
  `);

  const rows = (res as unknown as { rows?: Record<string, unknown>[] }).rows;
  if (!Array.isArray(rows)) return [];

  const out: RetrievedChunk[] = [];
  for (const r of rows) {
    const url = typeof r.url === "string" ? r.url : "";
    const title = r.title == null ? null : String(r.title);
    const body = typeof r.body === "string" ? r.body : "";
    const dist = typeof r.dist === "number" ? r.dist : Number(r.dist);
    if (!url && !body) continue;
    out.push({ url, title, body, distance: Number.isFinite(dist) ? dist : 1 });
  }
  return out;
}

/**
 * Embed query text and retrieve chunks. Returns empty array on any failure (caller falls back to stuffing).
 */
export async function retrieveChunksForQuery(customerId: string, query: string): Promise<RetrievedChunk[]> {
  if (!db || !query.trim()) return [];

  try {
    const [qEmb] = await embedTextsOpenAI([query.slice(0, 8000)]);
    if (!qEmb?.length) return [];
    return await retrieveSimilarChunks(customerId, qEmb, resolveChatRagTopK());
  } catch (e) {
    console.warn("[rag] retrieve failed, falling back:", e);
    return [];
  }
}

function mergeDedupeChunks(primary: RetrievedChunk[], secondary: RetrievedChunk[], maxTotal: number): RetrievedChunk[] {
  const seen = new Set<string>();
  const out: RetrievedChunk[] = [];
  const add = (c: RetrievedChunk) => {
    const key = `${c.url}\0${c.body.slice(0, 160)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };
  for (const c of primary) {
    add(c);
    if (out.length >= maxTotal) return out;
  }
  for (const c of secondary) {
    add(c);
    if (out.length >= maxTotal) return out;
  }
  return out;
}

/**
 * Embeds the user query plus an optional broad "augment" query in one API call, runs two ANN searches,
 * merges with dedupe. Improves answers for "what is this site?", blog discovery, and topic questions.
 */
export async function retrieveChunksForQueryMerged(
  customerId: string,
  query: string,
  augmentText: string | null
): Promise<RetrievedChunk[]> {
  if (!db || !query.trim()) return [];

  try {
    const q = query.slice(0, 8000);
    const aug = augmentText?.trim() ? augmentText.trim().slice(0, 8000) : "";
    const embeddings = aug ? await embedTextsOpenAI([q, aug]) : await embedTextsOpenAI([q]);
    if (!embeddings[0]?.length) return [];

    const k = resolveChatRagTopK();
    const primary = await retrieveSimilarChunks(customerId, embeddings[0]!, k);
    if (embeddings.length < 2 || !embeddings[1]?.length) {
      return primary;
    }
    const k2 = Math.max(4, Math.min(10, Math.ceil(k / 2)));
    const secondary = await retrieveSimilarChunks(customerId, embeddings[1]!, k2);
    return mergeDedupeChunks(primary, secondary, k + k2);
  } catch (e) {
    console.warn("[rag] merged retrieve failed, falling back:", e);
    return [];
  }
}

/** Uses env-driven augment text unless disabled. */
export async function retrieveChunksForCustomerChat(
  customerId: string,
  query: string
): Promise<RetrievedChunk[]> {
  const augment = resolveChatRagAugmentQueryText();
  return retrieveChunksForQueryMerged(customerId, query, augment);
}

export function buildRagContextBlock(chunks: readonly RetrievedChunk[], maxChars: number): string {
  let used = 0;
  const parts: string[] = [];
  for (const c of chunks) {
    const title = c.title?.trim() || "Page";
    const block = `## ${title}\nURL: ${c.url}\n\n${c.body}`;
    if (used + block.length > maxChars) break;
    parts.push(block);
    used += block.length;
  }
  return parts.join("\n\n---\n\n");
}
