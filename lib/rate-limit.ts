import { db } from "@/db";
import { chatRateLimits } from "@/db/schema";
import { sql } from "drizzle-orm";

/** Best-effort client IP for rate limits (Vercel / proxies). */
export function getClientIpFromRequest(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  return "unknown";
}

function floorToMinute(d: Date): Date {
  const t = new Date(d);
  t.setSeconds(0, 0);
  return t;
}

export async function checkAndIncrementRateLimit(input: {
  key: string;
  limitPerMinute: number;
}): Promise<{ ok: boolean; remaining: number }> {
  if (!db) return { ok: true, remaining: input.limitPerMinute };
  const windowStart = floorToMinute(new Date());
  const limit = Math.max(1, Math.round(input.limitPerMinute));

  // Atomic upsert + increment
  const res = await db.execute(sql`
    INSERT INTO chat_rate_limits (key, window_start, count, created_at, updated_at)
    VALUES (${input.key}, ${windowStart}, 1, now(), now())
    ON CONFLICT (key, window_start) DO UPDATE
      SET count = chat_rate_limits.count + 1,
          updated_at = now()
    RETURNING count
  `);

  const rows = (res as unknown as { rows?: { count: number }[] }).rows;
  const count = Array.isArray(rows) && rows[0] ? Number(rows[0].count) : 1;
  const remaining = Math.max(0, limit - count);
  return { ok: count <= limit, remaining };
}

