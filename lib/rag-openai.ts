import { resolveChatRagEmbeddingModel } from "@/lib/rag-config";

type EmbeddingResponse = {
  data?: { embedding: number[] }[];
  error?: { message?: string };
};

/**
 * Batch embeddings via OpenAI (same API key as chat).
 * Vectors must match `vector(1536)` in `019-content-chunks-rag.sql` (default for text-embedding-3-small).
 */
export async function embedTextsOpenAI(texts: readonly string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const model = resolveChatRagEmbeddingModel();

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [...texts],
    }),
  });

  const json = (await res.json()) as EmbeddingResponse;
  if (!res.ok) {
    throw new Error(json.error?.message ?? `OpenAI embeddings HTTP ${res.status}`);
  }

  const rows = json.data;
  if (!Array.isArray(rows) || rows.length !== texts.length) {
    throw new Error("OpenAI embeddings: unexpected response shape");
  }

  return rows.map((r) => {
    const e = r.embedding;
    if (!Array.isArray(e) || !e.length) throw new Error("OpenAI embeddings: missing vector");
    return e;
  });
}
