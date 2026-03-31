import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type JobRow = typeof jobs.$inferSelect;

export async function enqueueJob(input: {
  type: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  runAt?: Date;
  maxAttempts?: number;
}): Promise<void> {
  if (!db) return;
  try {
    await db.insert(jobs).values({
      type: input.type,
      payload: input.payload,
      dedupeKey: input.dedupeKey ?? null,
      runAt: input.runAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 8,
      status: "queued",
      updatedAt: new Date(),
    });
  } catch (e) {
    // Dedupe key conflicts are expected; treat as success.
    const msg = String(e);
    if (input.dedupeKey && msg.toLowerCase().includes("duplicate")) return;
    throw e;
  }
}

export async function claimNextJob(): Promise<JobRow | null> {
  if (!db) return null;

  // Atomic claim using SKIP LOCKED. This allows multiple cron invocations safely.
  const res = await db.execute(sql`
    WITH next_job AS (
      SELECT id
      FROM jobs
      WHERE status = 'queued' AND run_at <= now()
      ORDER BY run_at ASC, created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    UPDATE jobs
    SET status = 'running',
        locked_at = now(),
        attempts = attempts + 1,
        updated_at = now()
    WHERE id IN (SELECT id FROM next_job)
    RETURNING *
  `);

  const rows = (res as unknown as { rows?: JobRow[] }).rows;
  const job = Array.isArray(rows) ? rows[0] : null;
  return job ?? null;
}

export async function markJobSucceeded(jobId: string): Promise<void> {
  if (!db) return;
  await db
    .update(jobs)
    .set({ status: "succeeded", updatedAt: new Date(), lastError: null })
    .where(eq(jobs.id, jobId));
}

export async function markJobFailed(job: JobRow, error: unknown): Promise<void> {
  if (!db) return;
  const msg = error instanceof Error ? error.message : String(error);

  const attempts = Number(job.attempts ?? 0);
  const maxAttempts = Number(job.maxAttempts ?? 8);

  if (attempts >= maxAttempts) {
    await db
      .update(jobs)
      .set({ status: "failed", lastError: msg.slice(0, 4000), updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    return;
  }

  const backoffSeconds = Math.min(60 * 30, Math.pow(2, Math.max(0, attempts - 1)) * 10); // 10s, 20s, 40s...
  const jitter = Math.round(backoffSeconds * (0.2 + Math.random() * 0.3)); // +20–50%
  const runAt = new Date(Date.now() + (backoffSeconds + jitter) * 1000);

  await db
    .update(jobs)
    .set({
      status: "queued",
      runAt,
      lastError: msg.slice(0, 4000),
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, job.id));
}

