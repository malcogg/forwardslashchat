import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CrawlProgressSnapshot, CrawlProgressSource } from "@/lib/crawl-progress-types";

export type { CrawlProgressSnapshot, CrawlProgressSource } from "@/lib/crawl-progress-types";

export function crawlProgressNow(
  partial: Omit<CrawlProgressSnapshot, "updatedAt">
): CrawlProgressSnapshot {
  return { ...partial, updatedAt: new Date().toISOString() };
}

export async function setCustomerCrawlProgress(
  customerId: string,
  snapshot: CrawlProgressSnapshot | null
): Promise<void> {
  if (!db) return;
  await db
    .update(customers)
    .set({ crawlProgress: snapshot, updatedAt: new Date() })
    .where(eq(customers.id, customerId));
}

export type FirecrawlPollProgress = {
  firecrawlJobId: string;
  firecrawlStatus: string;
  elapsedSeconds: number;
};

/** DB writer suitable for `runFirecrawlCrawl` `onProgress`. */
export function createCrawlProgressPollerWriter(
  customerId: string,
  source: CrawlProgressSource,
  requestedLimit: number
): (info: FirecrawlPollProgress) => Promise<void> {
  return async (info) => {
    await setCustomerCrawlProgress(
      customerId,
      crawlProgressNow({
        phase: "firecrawl",
        source,
        firecrawlJobId: info.firecrawlJobId,
        firecrawlStatus: info.firecrawlStatus,
        elapsedSeconds: info.elapsedSeconds,
        requestedLimit,
      })
    );
  };
}
