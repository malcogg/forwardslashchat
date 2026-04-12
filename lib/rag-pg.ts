import { sql } from "drizzle-orm";

/** Safe pgvector literal for cosine ANN queries and inserts (numeric components only). */
export function pgVectorLiteral(vec: readonly number[]) {
  const inner = vec.map((n) => Number(n).toFixed(8)).join(",");
  return sql.raw(`'[${inner}]'::vector`);
}
