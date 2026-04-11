import { db } from "@/db";
import { content, contentChunks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { embedTextsOpenAI } from "@/lib/rag-openai";
import { pgVectorLiteral } from "@/lib/rag-pg";
import { resolveChatRagChunkChars, resolveChatRagChunkOverlap } from "@/lib/rag-config";
import { chunkTextForRag } from "@/lib/text-chunking";

const EMBED_BATCH = 24;

type StagedChunk = {
  customerId: string;
  contentId: string;
  chunkIndex: number;
  url: string;
  title: string | null;
  body: string;
  embedding: number[];
};

/**
 * Rebuild pgvector chunks for a customer after crawl (or manual rescan).
 * Idempotent: replaces all rows in `content_chunks` for this customer.
 * Swallows errors (logs) so crawl success is never blocked by embedding failures.
 */
export async function reindexCustomerContentChunks(customerId: string): Promise<void> {
  if (!db) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[rag] skip reindex: OPENAI_API_KEY not set");
    return;
  }

  const maxChunkChars = resolveChatRagChunkChars();
  const overlap = resolveChatRagChunkOverlap();

  try {
    const rows = await db
      .select({
        id: content.id,
        url: content.url,
        title: content.title,
        body: content.content,
      })
      .from(content)
      .where(eq(content.customerId, customerId));

    const staged: StagedChunk[] = [];

    for (const row of rows) {
      const parts = chunkTextForRag(row.body, maxChunkChars, overlap);
      for (let i = 0; i < parts.length; i++) {
        const body = parts[i]!;
        staged.push({
          customerId,
          contentId: row.id,
          chunkIndex: i,
          url: row.url,
          title: row.title,
          body,
          embedding: [], // filled per batch
        });
      }
    }

    if (staged.length === 0) {
      await db.delete(contentChunks).where(eq(contentChunks.customerId, customerId));
      return;
    }

    for (let i = 0; i < staged.length; i += EMBED_BATCH) {
      const slice = staged.slice(i, i + EMBED_BATCH);
      const vectors = await embedTextsOpenAI(slice.map((s) => s.body));
      for (let j = 0; j < slice.length; j++) {
        slice[j]!.embedding = vectors[j]!;
      }
    }

    await db.delete(contentChunks).where(eq(contentChunks.customerId, customerId));

    for (const s of staged) {
      const lit = pgVectorLiteral(s.embedding);
      await db.execute(sql`
        INSERT INTO content_chunks (customer_id, content_id, chunk_index, url, title, body, embedding)
        VALUES (${s.customerId}, ${s.contentId}, ${s.chunkIndex}, ${s.url}, ${s.title}, ${s.body}, ${lit})
      `);
    }
  } catch (e) {
    console.error("[rag] reindex failed:", e);
  }
}
