export type CrawlProgressSource = "manual_api" | "auto_crawl_customer";

export type CrawlProgressSnapshot = {
  phase: "starting" | "firecrawl" | "saving" | "failed";
  source: CrawlProgressSource;
  firecrawlJobId?: string;
  firecrawlStatus?: string;
  elapsedSeconds?: number;
  requestedLimit?: number;
  error?: string;
  updatedAt: string;
};
