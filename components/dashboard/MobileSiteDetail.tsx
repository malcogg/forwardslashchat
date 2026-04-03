"use client";

import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { getProgressSteps, getPlanLabel, getSiteStatusLabel } from "./mobile-types";

const PUBLIC_CNAME_TARGET =
  process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.vercel-dns.com";

type SiteData = {
  order: {
    id: string;
    status?: string;
    planSlug?: string;
    amountCents?: number;
    bundleYears?: number;
  };
  customer: {
    id: string;
    businessName: string;
    websiteUrl: string;
    domain?: string;
    subdomain?: string;
    status?: string;
  } | null;
  contentCount?: number;
};

type MobileSiteDetailProps = {
  siteData: SiteData;
  estimatedPages: number;
  onBack: () => void;
  onRescan: () => void;
  crawling: boolean;
  canRescan: boolean;
  copied: boolean;
  onCopyUrl: () => void;
};

export function MobileSiteDetail({
  siteData,
  estimatedPages,
  onBack,
  onRescan,
  crawling,
  canRescan,
  copied,
  onCopyUrl,
}: MobileSiteDetailProps) {
  const { order, customer, contentCount = 0 } = siteData;
  const isWebsiteOrder = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  const statusLabel = getSiteStatusLabel(order, customer, contentCount);
  const steps = getProgressSteps(order, customer, contentCount);
  const planLabel = getPlanLabel(order, estimatedPages);
  const amountPaid = ((order.amountCents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const siteName = customer?.businessName || customer?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "Site";
  const chatbotUrl =
    customer?.subdomain && customer?.domain
      ? `https://${customer.subdomain}.${customer.domain}`
      : null;
  const isLive = customer?.status === "delivered" || (isWebsiteOrder && order.status === "delivered");
  const cnameValue = PUBLIC_CNAME_TARGET;

  const planFeatures = isWebsiteOrder
    ? ["Full website design", "Hosting included", "Ongoing support"]
    : ["AI trained on your content", "Hosting included", "No monthly fees", "Your domain (chat.yoursite.com)"];

  return (
    <div className="min-h-screen flex flex-col bg-background pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0">
          {siteName}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
            statusLabel === "Live" || statusLabel === "Delivered"
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : statusLabel === "Domain Setup" || statusLabel === "In progress"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {statusLabel}
        </span>

        {/* Plan card */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-muted-foreground">
              {contentCount} pages · {planLabel}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-medium text-foreground">{amountPaid}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Hosting included</p>
        </div>

        {/* Vertical progress */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Progress</h2>
        <div className="space-y-0 rounded-xl border border-border overflow-hidden">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`flex items-center gap-3 px-4 py-3 ${i < steps.length - 1 ? "border-b border-border" : ""}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  s.done ? "bg-emerald-600 text-white" : "border border-muted-foreground/50"
                }`}
              >
                {s.done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
              </span>
              <span className={`text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Chatbot URL */}
        {!isWebsiteOrder && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground mb-2">Your chatbot URL</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {chatbotUrl ? (
                <>
                  <span className="text-sm text-foreground font-mono truncate flex-1 min-w-0">
                    {chatbotUrl.replace(/^https?:\/\//, "")}
                  </span>
                  {isLive && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onCopyUrl}
                    className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Add your domain to get your URL</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              DNS record: <span className="font-mono">CNAME</span> {customer?.subdomain ?? "chat"} → <span className="font-mono">{cnameValue}</span>
            </p>
          </div>
        )}

        {/* Test Chatbot + Rescan */}
        {!isWebsiteOrder && customer && (
          <div className="mt-6 flex flex-col gap-3">
            {isLive && chatbotUrl && (
              <a
                href={chatbotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Test Chatbot
              </a>
            )}
            <button
              type="button"
              onClick={onRescan}
              disabled={crawling || !canRescan}
              className={`w-full py-3 px-4 rounded-xl border border-border font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors ${crawling ? "animate-pulse" : ""}`}
            >
              {crawling ? "Scanning…" : canRescan ? "Rescan Site" : "Rescan (7-day cooldown)"}
            </button>
          </div>
        )}

        {/* Plan features */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Plan features</h2>
          <ul className="space-y-2">
            {planFeatures.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
