/**
 * Character-based chunking for RAG (no tokenizer dependency).
 * Prefers paragraph boundaries; falls back to sliding windows with overlap.
 */

export function chunkTextForRag(
  text: string,
  maxChunkChars: number,
  overlapChars: number
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const overlap = Math.min(Math.max(0, overlapChars), Math.floor(maxChunkChars / 2));
  const maxLen = Math.max(200, maxChunkChars);

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const pieces: string[] = [];

  let buf = "";
  const flush = () => {
    const t = buf.trim();
    if (t) pieces.push(t);
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length > maxLen) {
      flush();
      pieces.push(...windowChunk(p, maxLen, overlap));
      continue;
    }
    const next = buf ? `${buf}\n\n${p}` : p;
    if (next.length <= maxLen) {
      buf = next;
    } else {
      flush();
      buf = p;
    }
  }
  flush();

  const merged: string[] = [];
  for (const piece of pieces) {
    if (piece.length <= maxLen) {
      merged.push(piece);
    } else {
      merged.push(...windowChunk(piece, maxLen, overlap));
    }
  }

  return dedupeAdjacent(merged);
}

function windowChunk(text: string, maxLen: number, overlap: number): string[] {
  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + maxLen);
    const slice = text.slice(start, end).trim();
    if (slice) out.push(slice);
    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}

function dedupeAdjacent(chunks: string[]): string[] {
  const out: string[] = [];
  for (const c of chunks) {
    if (out.length && out[out.length - 1] === c) continue;
    out.push(c);
  }
  return out;
}
