/**
 * Structured JSON logs for the background job queue (grep-friendly in Vercel/runtime logs).
 */

export function extractJobCorrelation(input: {
  type: string;
  dedupeKey: string | null;
  payload: Record<string, unknown>;
}): { customerId: string | null; orderId: string | null } {
  const p = input.payload ?? {};
  const customerId = typeof p.customerId === "string" ? p.customerId : null;
  let orderId = typeof p.orderId === "string" ? p.orderId : null;
  const dk = input.dedupeKey;
  if (!orderId && dk?.startsWith("auto_crawl_")) {
    const rest = dk.slice("auto_crawl_".length);
    if (rest.length > 0) orderId = rest;
  }
  return { customerId, orderId };
}

export type JobLogEvent =
  | "job_claimed"
  | "job_succeeded"
  | "job_retry_scheduled"
  | "job_failed_permanent";

export function logJobEvent(
  event: JobLogEvent,
  input: {
    jobId: string;
    type: string;
    dedupeKey: string | null;
    payload?: Record<string, unknown>;
    attempts?: number;
    maxAttempts?: number;
    lastError?: string | null;
    nextRunAt?: Date | null;
  }
): void {
  const payload = input.payload ?? {};
  const { customerId, orderId } = extractJobCorrelation({
    type: input.type,
    dedupeKey: input.dedupeKey,
    payload,
  });
  const line: Record<string, unknown> = {
    event,
    ts: new Date().toISOString(),
    jobId: input.jobId,
    type: input.type,
    dedupeKey: input.dedupeKey,
    customerId,
    orderId,
  };
  if (input.attempts !== undefined) line.attempts = input.attempts;
  if (input.maxAttempts !== undefined) line.maxAttempts = input.maxAttempts;
  if (input.lastError != null) line.lastError = String(input.lastError).slice(0, 500);
  if (input.nextRunAt) line.nextRunAt = input.nextRunAt.toISOString();

  const json = JSON.stringify(line);
  if (event === "job_failed_permanent" || event === "job_retry_scheduled") {
    console.error(json);
  } else {
    console.info(json);
  }
}
