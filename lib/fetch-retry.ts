type RetryAfter = { delayMs: number } | null;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(header: string | null): RetryAfter {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;

  // Retry-After: <seconds>
  const asSeconds = Number(trimmed);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return { delayMs: Math.min(60_000, Math.round(asSeconds * 1000)) };
  }

  // Retry-After: <http-date>
  const asDate = Date.parse(trimmed);
  if (!Number.isNaN(asDate)) {
    const delayMs = asDate - Date.now();
    if (delayMs > 0) return { delayMs: Math.min(60_000, delayMs) };
  }

  return null;
}

function withJitter(ms: number): number {
  const factor = 0.7 + Math.random() * 0.6; // 0.7–1.3x
  return Math.max(0, Math.round(ms * factor));
}

export type FetchWithRetryOptions = RequestInit & {
  /** Per-attempt timeout (ms). Default 10s. */
  timeoutMs?: number;
  /** Max attempts including the first try. Default 3. */
  maxAttempts?: number;
  /** Base backoff (ms). Default 300ms. */
  baseDelayMs?: number;
  /** Cap backoff (ms). Default 5000ms. */
  maxDelayMs?: number;
  /**
   * If true, retries are allowed for non-idempotent methods (POST/PATCH/PUT/DELETE).
   * Default false.
   */
  allowNonIdempotentRetry?: boolean;
  /** Optional tag for logs (no secrets). */
  logTag?: string;
};

function isIdempotentMethod(method: string | undefined): boolean {
  const m = (method ?? "GET").toUpperCase();
  return m === "GET" || m === "HEAD" || m === "OPTIONS";
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeoutMs = 10_000,
    maxAttempts = 3,
    baseDelayMs = 300,
    maxDelayMs = 5_000,
    allowNonIdempotentRetry = false,
    logTag,
    ...init
  } = options;

  const method = (init.method ?? "GET").toUpperCase();
  const canRetryMethod = isIdempotentMethod(method) || allowNonIdempotentRetry;

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt++;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(t);

      if (res.ok) return res;

      if (!canRetryMethod || attempt >= maxAttempts || !isRetryableStatus(res.status)) {
        return res;
      }

      const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delay = withJitter(retryAfter?.delayMs ?? backoff);

      if (logTag) {
        console.warn(`[${logTag}] fetch retry`, { attempt, status: res.status, delayMs: delay });
      }

      await sleep(delay);
      continue;
    } catch (e) {
      clearTimeout(t);
      lastError = e;

      const name = e instanceof Error ? e.name : "";
      const retryable = name === "AbortError" || canRetryMethod;
      if (!retryable || attempt >= maxAttempts) break;

      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const delay = withJitter(backoff);

      if (logTag) {
        console.warn(`[${logTag}] fetch retry (error)`, { attempt, delayMs: delay, error: String(e) });
      }

      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Fetch failed");
}

