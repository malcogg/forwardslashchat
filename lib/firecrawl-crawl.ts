import { fetchWithRetry } from "@/lib/fetch-retry";

export type FirecrawlPage = {
  markdown?: string;
  metadata?: { sourceURL?: string; title?: string };
};

export function getFirecrawlPollConfig(): { maxWaitSeconds: number; pollIntervalSeconds: number } {
  const maxWait = Number.parseInt(process.env.FIRECRAWL_CRAWL_MAX_WAIT_SECONDS ?? "300", 10);
  const poll = Number.parseInt(process.env.FIRECRAWL_CRAWL_POLL_INTERVAL_SECONDS ?? "5", 10);
  return {
    maxWaitSeconds: Number.isFinite(maxWait) && maxWait >= 60 && maxWait <= 3600 ? maxWait : 300,
    pollIntervalSeconds: Number.isFinite(poll) && poll >= 2 && poll <= 60 ? poll : 5,
  };
}

export type RunFirecrawlCrawlOptions = {
  /** Called after the job is created and on each status poll (for persisted dashboard progress). */
  onProgress?: (info: {
    firecrawlJobId: string;
    firecrawlStatus: string;
    elapsedSeconds: number;
  }) => void | Promise<void>;
};

/**
 * Start a v2 crawl and poll until completed, failed, or timeout.
 */
export async function runFirecrawlCrawl(
  apiKey: string,
  url: string,
  limit: number,
  options?: RunFirecrawlCrawlOptions
): Promise<{
  success: boolean;
  data?: FirecrawlPage[];
  error?: string;
  crawlJobId?: string;
}> {
  const start = await fetchWithRetry("https://api.firecrawl.dev/v2/crawl", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, limit }),
    timeoutMs: 20_000,
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 8_000,
    allowNonIdempotentRetry: true,
    logTag: "firecrawl-start",
  });

  const startJson = (await start.json()) as { success?: boolean; id?: string; error?: string };
  if (!startJson.success || !startJson.id) {
    return { success: false, error: startJson.error ?? "Could not start crawl" };
  }

  const crawlJobId = startJson.id;
  const { maxWaitSeconds, pollIntervalSeconds } = getFirecrawlPollConfig();
  let elapsed = 0;

  const emit = async (firecrawlStatus: string) => {
    await options?.onProgress?.({
      firecrawlJobId: crawlJobId,
      firecrawlStatus,
      elapsedSeconds: elapsed,
    });
  };

  await emit("started");

  while (elapsed < maxWaitSeconds) {
    await new Promise((r) => setTimeout(r, pollIntervalSeconds * 1000));
    elapsed += pollIntervalSeconds;

    const statusRes = await fetchWithRetry(`https://api.firecrawl.dev/v2/crawl/${crawlJobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeoutMs: 15_000,
      maxAttempts: 3,
      baseDelayMs: 400,
      maxDelayMs: 4_000,
      logTag: "firecrawl-status",
    });

    const status = (await statusRes.json()) as {
      success?: boolean;
      status?: string;
      data?: FirecrawlPage[];
      error?: string;
    };

    const remote = status.status ?? "unknown";
    await emit(remote);

    if (!status.success) return { success: false, error: status.error ?? "Crawl error", crawlJobId };
    if (status.status === "failed") return { success: false, error: status.error ?? "Crawl failed", crawlJobId };
    if (status.status === "completed" && Array.isArray(status.data)) {
      return { success: true, data: status.data, crawlJobId };
    }
  }

  return { success: false, error: `Crawl timed out after ${maxWaitSeconds}s`, crawlJobId };
}

export function logCrawlOutcome(input: {
  source: "manual_api" | "auto_crawl_customer";
  customerId: string;
  orderId: string;
  websiteUrl: string;
  requestedLimit: number;
  rawPageCount: number;
  storedPageCount: number;
  crawlJobId?: string;
  error?: string;
}): void {
  const dropped = Math.max(0, input.rawPageCount - input.storedPageCount);
  const payload = {
    event: "crawl_outcome",
    source: input.source,
    customerId: input.customerId,
    orderId: input.orderId,
    websiteUrl: input.websiteUrl,
    requestedLimit: input.requestedLimit,
    rawPageCount: input.rawPageCount,
    storedPageCount: input.storedPageCount,
    droppedByFilter: dropped,
    crawlJobId: input.crawlJobId ?? null,
    error: input.error ?? null,
  };
  if (input.error) {
    console.error(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}

/** Warn when Firecrawl returned many URLs but content filter kept few rows (thin or noisy sites). */
export function logCrawlFilterShortfall(input: {
  source: "manual_api" | "auto_crawl_customer";
  customerId: string;
  orderId: string;
  requestedLimit: number;
  rawPageCount: number;
  storedPageCount: number;
}): void {
  const { rawPageCount, storedPageCount } = input;
  if (rawPageCount < 8) return;
  if (storedPageCount >= Math.max(4, Math.floor(rawPageCount * 0.35))) return;
  console.warn(
    JSON.stringify({
      event: "crawl_filter_shortfall",
      source: input.source,
      customerId: input.customerId,
      orderId: input.orderId,
      requestedLimit: input.requestedLimit,
      rawPageCount,
      storedPageCount,
      droppedByFilter: rawPageCount - storedPageCount,
    })
  );
}
