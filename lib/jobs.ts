import { db } from "@/db";
import { jobs } from "@/db/schema";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { logJobEvent } from "@/lib/job-logging";

export type JobRow = typeof jobs.$inferSelect;

/** Cron worker + enqueue helpers use the same type strings. */
export const JOB_TYPE_AUTO_CRAWL = "auto_crawl_customer";
export const JOB_TYPE_GO_LIVE = "go_live_domain";

/**
 * After crawl (or if content already exists), queue DNS verify + Vercel attach.
 * Deduped per customer; retries with longer backoff in markJobFailed (DNS can take days).
 */
export async function enqueueGoLiveForCustomer(customerId: string): Promise<void> {
  await enqueueJob({
    type: JOB_TYPE_GO_LIVE,
    dedupeKey: `go_live_${customerId}`,
    payload: { customerId },
    maxAttempts: 96,
    runAt: new Date(),
  });
}

export async function getJobByDedupeKey(dedupeKey: string): Promise<JobRow | null> {
  if (!db) return null;
  const res = await db.execute(sql`
    SELECT *
    FROM jobs
    WHERE dedupe_key = ${dedupeKey}
    LIMIT 1
  `);
  const rows = (res as unknown as { rows?: JobRow[] }).rows;
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

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

/**
 * Enqueue a job by dedupeKey, or "kick" an existing one back to queued.
 * This is ideal for user-triggered actions (like "Go live") that may be clicked multiple times.
 */
export async function enqueueOrKickJob(input: {
  type: string;
  payload: Record<string, unknown>;
  dedupeKey: string;
  runAt?: Date;
  maxAttempts?: number;
}): Promise<void> {
  if (!db) return;
  const runAt = input.runAt ?? new Date();
  const maxAttempts = input.maxAttempts ?? 8;
  await db.execute(sql`
    INSERT INTO jobs (type, status, dedupe_key, attempts, max_attempts, run_at, payload, created_at, updated_at)
    VALUES (${input.type}, 'queued', ${input.dedupeKey}, 0, ${maxAttempts}, ${runAt}, ${JSON.stringify(input.payload)}::jsonb, now(), now())
    ON CONFLICT (dedupe_key) DO UPDATE
    SET status = 'queued',
        type = EXCLUDED.type,
        payload = EXCLUDED.payload,
        run_at = EXCLUDED.run_at,
        max_attempts = EXCLUDED.max_attempts,
        last_error = NULL,
        updated_at = now()
  `);
}

/**
 * Jobs left in `running` (e.g. serverless timeout or crash after claim) never complete.
 * Call from the cron worker before claiming new work. Uses `JOBS_STUCK_AFTER_MINUTES` (default 90).
 * Requeues or permanently fails via `markJobFailed` (same retry / alert path as normal failures).
 */
export async function recoverStuckRunningJobs(options?: { olderThanMinutes?: number }): Promise<number> {
  if (!db) return 0;
  const raw = Number(process.env.JOBS_STUCK_AFTER_MINUTES ?? 90);
  const minutes = options?.olderThanMinutes ?? Math.max(5, Math.min(24 * 60, Number.isFinite(raw) ? raw : 90));
  const threshold = new Date(Date.now() - minutes * 60 * 1000);

  const staleRunning = or(
    lt(jobs.lockedAt, threshold),
    and(isNull(jobs.lockedAt), lt(jobs.updatedAt, threshold))
  );

  const stuck = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, "running"), staleRunning));

  const err = new Error(
    `Job exceeded ${minutes} minute running timeout (worker lost or crashed). Requeued or failed per retry policy.`
  );

  let count = 0;
  for (const job of stuck) {
    await markJobFailed(job, err);
    count++;
  }
  return count;
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
  if (job) {
    logJobEvent("job_claimed", {
      jobId: job.id,
      type: job.type,
      dedupeKey: job.dedupeKey,
      payload: job.payload,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
    });
  }
  return job ?? null;
}

export async function markJobSucceeded(job: JobRow): Promise<void> {
  if (!db) return;
  logJobEvent("job_succeeded", {
    jobId: job.id,
    type: job.type,
    dedupeKey: job.dedupeKey,
    payload: job.payload,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
  });
  await db
    .update(jobs)
    .set({ status: "succeeded", updatedAt: new Date(), lastError: null })
    .where(eq(jobs.id, job.id));
}

export async function markJobFailed(job: JobRow, error: unknown): Promise<void> {
  if (!db) return;
  const msg = error instanceof Error ? error.message : String(error);

  const attempts = Number(job.attempts ?? 0);
  const maxAttempts = Number(job.maxAttempts ?? 8);

  if (attempts >= maxAttempts) {
    logJobEvent("job_failed_permanent", {
      jobId: job.id,
      type: job.type,
      dedupeKey: job.dedupeKey,
      payload: job.payload,
      attempts,
      maxAttempts,
      lastError: msg,
    });

    await db
      .update(jobs)
      .set({ status: "failed", lastError: msg.slice(0, 4000), updatedAt: new Date() })
      .where(eq(jobs.id, job.id));

    let payloadSummary = "";
    try {
      const p = job.payload;
      payloadSummary = p && typeof p === "object" ? JSON.stringify(p).slice(0, 2000) : String(p ?? "").slice(0, 2000);
    } catch {
      payloadSummary = "(unparseable)";
    }
    void import("./job-failure-alert")
      .then((m) =>
        m.notifyAdminsJobPermanentlyFailed({
          jobId: job.id,
          type: job.type,
          dedupeKey: job.dedupeKey,
          lastError: msg.slice(0, 4000),
          attempts,
          maxAttempts,
          payloadSummary,
        }),
      )
      .catch(() => {});

    return;
  }

  const isGoLive = job.type === JOB_TYPE_GO_LIVE;
  // Go-live waits on customer DNS; use multi-hour backoff (cap 6h). Crawl/other: fast retry.
  const backoffSeconds = isGoLive
    ? Math.min(6 * 3600, 300 + Math.min(attempts, 72) * 240)
    : Math.min(60 * 30, Math.pow(2, Math.max(0, attempts - 1)) * 10);
  const jitter = Math.round(backoffSeconds * (0.2 + Math.random() * 0.3)); // +20–50%
  const runAt = new Date(Date.now() + (backoffSeconds + jitter) * 1000);

  logJobEvent("job_retry_scheduled", {
    jobId: job.id,
    type: job.type,
    dedupeKey: job.dedupeKey,
    payload: job.payload,
    attempts,
    maxAttempts,
    lastError: msg,
    nextRunAt: runAt,
  });

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

