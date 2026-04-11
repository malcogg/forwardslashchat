import { db } from "@/db";
import { embedTextsOpenAI } from "@/lib/rag-openai";
import { pgVectorLiteral } from "@/lib/rag-pg";
import { resolveChatRagTopK } from "@/lib/rag-config";
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
