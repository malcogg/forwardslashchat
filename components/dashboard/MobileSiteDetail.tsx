"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import { GoLiveButton } from "@/components/dashboard/GoLiveButton";
import type { CrawlProgressSnapshot } from "@/lib/crawl-progress-types";
import {
  getMobilePaymentCtaLabels,
  getProgressSteps,
  getPlanLabel,
  getSiteStatusLabel,
} from "./mobile-types";

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
    crawlProgress?: CrawlProgressSnapshot | null;
  } | null;
  contentCount?: number;
};

type MobileSiteDetailProps = {
  siteData: SiteData;
  estimatedPages: number;
  isPaid: boolean;
  chatbotCheckoutHref: string;
  websiteCheckoutHref: string;
  unpaidQuoteDollars: number | null;
  /** Notifications control (e.g. bell); rendered in the sticky header */
  headerEnd?: ReactNode;
  onBack: () => void;
  onRescan: () => void;
  crawling: boolean;
  canRescan: boolean;
  copied: boolean;
  onCopyUrl: () => void;
  authHeaders: () => Promise<HeadersInit>;
  onGoLiveSuccess: () => void | Promise<void>;
};

export function MobileSiteDetail({
  siteData,
  estimatedPages,
  isPaid,
  chatbotCheckoutHref,
  websiteCheckoutHref,
  unpaidQuoteDollars,
  headerEnd,
  onBack,
  onRescan,
  crawling,
  canRescan,
  copied,
  onCopyUrl,
  authHeaders,
  onGoLiveSuccess,
}: MobileSiteDetailProps) {
  const { order, customer, contentCount = 0 } = siteData;
  const isWebsiteOrder = order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);
  const statusLabel = getSiteStatusLabel(order, customer, contentCount);
  const steps = getProgressSteps(order, customer, contentCount);
  const planLabel = getPlanLabel(order, estimatedPages);
  const amountMoney = ((order.amountCents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const paymentCta = getMobilePaymentCtaLabels({
    isWebsiteOrder: Boolean(isWebsiteOrder),
    unpaidQuoteDollars,
    amountCents: order.amountCents,
  });
  const payHref = isWebsiteOrder ? websiteCheckoutHref : chatbotCheckoutHref;
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

  const trainingRef = useRef<HTMLDivElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const scrollTo = (el: HTMLElement | null) => {
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToDomainSmooth = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        domainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  const prevContentCountRef = useRef<number | null>(null);
  const prevCustomerStatusRef = useRef<string | undefined | null>(null);
  const didAutoScrollAfterIndexRef = useRef(false);
  const didAutoScrollAfterDnsSetupRef = useRef(false);

  useEffect(() => {
    didAutoScrollAfterIndexRef.current = false;
    didAutoScrollAfterDnsSetupRef.current = false;
    prevContentCountRef.current = null;
    prevCustomerStatusRef.current = null;
  }, [order.id]);

  useEffect(() => {
    if (isWebsiteOrder || !isPaid) {
      prevContentCountRef.current = contentCount;
      return;
    }
    const prev = prevContentCountRef.current;
    if (prev !== null && prev === 0 && contentCount > 0 && !didAutoScrollAfterIndexRef.current) {
      didAutoScrollAfterIndexRef.current = true;
      scrollToDomainSmooth();
    }
    prevContentCountRef.current = contentCount;
  }, [contentCount, isPaid, isWebsiteOrder]);

  useEffect(() => {
    if (isWebsiteOrder || !isPaid) {
      prevCustomerStatusRef.current = customer?.status ?? null;
      return;
    }
    const cur = customer?.status;
    const prev = prevCustomerStatusRef.current;
    if (
      prev !== null &&
      cur === "dns_setup" &&
      prev !== "dns_setup" &&
      !didAutoScrollAfterDnsSetupRef.current
    ) {
      didAutoScrollAfterDnsSetupRef.current = true;
      scrollToDomainSmooth();
    }
    prevCustomerStatusRef.current = cur ?? null;
  }, [customer?.status, isPaid, isWebsiteOrder]);

  const trainingBusy =
    !!customer &&
    contentCount === 0 &&
    isPaid &&
    ["crawling", "indexing"].includes(customer.status ?? "");

  const deliveredStepDone = isWebsiteOrder && order.status === "delivered";

  const renderStepNudge = (stepKey: string, stepDone: boolean) => {
    if (isWebsiteOrder) {
      if (stepKey === "payment" && !stepDone) {
        return (
          <Link
            href={payHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {paymentCta.compact}
          </Link>
        );
      }
      if (stepKey === "payment" && stepDone && !deliveredStepDone) {
        return <p className="text-[11px] text-muted-foreground leading-snug">We&apos;ll email you with next steps.</p>;
      }
      return null;
    }

    const contentDone =
      contentCount > 0 || ["dns_setup", "testing", "delivered"].includes(customer?.status ?? "");
    const dnsDone = ["testing", "delivered"].includes(customer?.status ?? "");
    const liveDone = customer?.status === "delivered";

    if (stepKey === "payment") {
      if (!stepDone) {
        return (
          <Link
            href={payHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {paymentCta.compact}
          </Link>
        );
      }
      if (!contentDone) {
        return (
          <button
            type="button"
            onClick={() => scrollTo(trainingRef.current)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Next: Index site →
          </button>
        );
      }
      return null;
    }

    if (stepKey === "content") {
      if (!isPaid) return null;
      if (!stepDone) {
        if (trainingBusy) {
          return <p className="text-[11px] text-muted-foreground">Indexing your site (~2–8 min)…</p>;
        }
        return (
          <button
            type="button"
            onClick={onRescan}
            disabled={crawling || !customer}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            {crawling ? "Starting scan…" : "Scan site"}
          </button>
        );
      }
      if (!dnsDone) {
        return (
          <button
            type="button"
            onClick={() => scrollTo(domainRef.current)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Next: Connect domain →
          </button>
        );
      }
      return null;
    }

    if (stepKey === "dns") {
      if (!contentDone) return null;
      if (!stepDone) {
        return (
          <button
            type="button"
            onClick={() => scrollTo(domainRef.current)}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/50"
          >
            DNS & verify
          </button>
        );
      }
      if (!liveDone && chatbotUrl) {
        return (
          <button
            type="button"
            onClick={() => scrollTo(liveRef.current)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Next: Open chatbot →
          </button>
        );
      }
      return null;
    }

    if (stepKey === "live") {
      if (!dnsDone) return null;
      if (!stepDone && customer?.status === "testing") {
        return <p className="text-[11px] text-muted-foreground">Provisioning HTTPS — usually a few minutes.</p>;
      }
      if (stepDone && chatbotUrl) {
        return (
          <a
            href={chatbotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            Open live chatbot
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      if (!stepDone && chatbotUrl) {
        return (
          <a
            href={chatbotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted/50"
          >
            Preview chatbot
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
      return null;
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground truncate flex-1 min-w-0">
          {siteName}
        </h1>
        {headerEnd ? <div className="shrink-0 flex items-center">{headerEnd}</div> : null}
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <span
          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
            statusLabel === "Live" || statusLabel === "Delivered"
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              : statusLabel === "Domain" ||
                  statusLabel === "In progress" ||
                  statusLabel === "Indexing" ||
                  statusLabel === "Ready to scan"
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {statusLabel}
        </span>

        {!isPaid && !customer && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4 ring-1 ring-emerald-500/10 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
            <h2 className="text-base font-semibold text-foreground mt-1">Checkout required</h2>
            <p className="text-xs text-muted-foreground mt-2 leading-snug">
              Complete checkout to attach billing and continue setup for this site.
            </p>
            <Link
              href={payHref}
              className="mt-4 flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md"
            >
              {paymentCta.primary}
            </Link>
          </div>
        )}

        {!isPaid && customer && (
          <div className="rounded-xl border border-border bg-card p-4 mb-4 ring-1 ring-emerald-500/10 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
            {isWebsiteOrder ? (
              <>
                <h2 className="text-base font-semibold text-foreground mt-1">Confirm your website order</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-snug">
                  Pay once to reserve your build. We&apos;ll email you to schedule kickoff.
                </p>
                <Link
                  href={payHref}
                  className="mt-4 flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  {paymentCta.primary}
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-base font-semibold text-foreground mt-1">Activate this chatbot</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-snug">
                  One checkout unlocks site indexing, hosting, and your chat subdomain.
                </p>
                <Link
                  href={payHref}
                  className="mt-4 flex items-center justify-center w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  {paymentCta.primary}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Plan card */}
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-muted-foreground">
              {contentCount} pages · {planLabel}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">{isPaid ? "Amount paid" : "Due at checkout"}</span>
            <span className="font-medium text-foreground">
              {isPaid
                ? amountMoney
                : unpaidQuoteDollars != null
                  ? `$${unpaidQuoteDollars.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : order.amountCents != null && order.amountCents > 0
                    ? amountMoney
                    : "Shown at checkout"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Hosting included</p>
        </div>

        {/* Vertical progress — each step includes a nudge (pay / train / domain / live) */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Progress</h2>
        <div className="space-y-0 rounded-xl border border-border overflow-hidden">
          {steps.map((s, i) => {
            const nudge = renderStepNudge(s.key, s.done);
            return (
              <div
                key={s.key}
                className={`flex flex-col gap-2 px-4 py-3 ${i < steps.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-3 min-h-[28px]">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      s.done ? "bg-emerald-600 text-white" : "border border-muted-foreground/50"
                    }`}
                  >
                    {s.done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
                  </span>
                  <span className={`text-sm font-medium ${s.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {nudge ? <div className="pl-9 pb-0.5">{nudge}</div> : null}
              </div>
            );
          })}
        </div>

        {/* Train & rescan — first action after payment (scroll target for progress nudges) */}
        {!isWebsiteOrder && customer && isPaid && (
          <div ref={trainingRef} className="mt-6 flex flex-col gap-3 scroll-mt-24">
            <h2 className="text-sm font-semibold text-foreground">Index your site</h2>
            <p className="text-xs text-muted-foreground leading-snug">
              We crawl public pages to train your chatbot. You can rescan later (cooldown applies).
            </p>
            <button
              type="button"
              onClick={onRescan}
              disabled={crawling || !canRescan}
              className={`w-full py-3 px-4 rounded-xl border border-border font-medium hover:bg-muted/50 disabled:opacity-50 transition-colors ${crawling ? "animate-pulse" : ""}`}
            >
              {crawling
                ? "Scanning…"
                : contentCount > 0
                  ? "Rescan website"
                  : canRescan
                    ? "Scan website"
                    : "Rescan (7-day cooldown)"}
            </button>
            {(() => {
              const cp = customer?.crawlProgress;
              if (!cp) return null;
              if (cp.phase === "failed") {
                return (
                  <p className="text-xs text-destructive leading-snug">
                    Scan failed: {cp.error?.slice(0, 180) ?? "Error"}
                  </p>
                );
              }
              if (!["starting", "firecrawl", "saving"].includes(cp.phase)) return null;
              return (
                <p className="text-xs text-muted-foreground leading-snug tabular-nums">
                  {cp.phase === "starting" && "Connecting to Firecrawl…"}
                  {cp.phase === "firecrawl" && (
                    <>
                      Scan in progress
                      {cp.firecrawlStatus ? ` · ${cp.firecrawlStatus}` : ""}
                      {typeof cp.elapsedSeconds === "number" ? ` · ~${cp.elapsedSeconds}s` : ""}
                    </>
                  )}
                  {cp.phase === "saving" && "Saving pages…"}
                </p>
              );
            })()}
          </div>
        )}

        {isPaid && !isWebsiteOrder && (
          <div ref={domainRef} className="mt-6 space-y-4 scroll-mt-24">
            {customer?.status === "dns_setup" &&
              contentCount > 0 &&
              customer.subdomain &&
              customer.domain && (
                <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">Connect your domain</h2>
                  <p className="text-xs text-muted-foreground">
                    Add a CNAME: <span className="font-mono text-foreground">{customer.subdomain}</span> →{" "}
                    <span className="font-mono text-foreground">{cnameValue}</span>
                  </p>
                  <GoLiveButton
                    customerId={customer.id}
                    customerDomain={`${customer.subdomain}.${customer.domain}`}
                    onSuccess={onGoLiveSuccess}
                    authHeaders={authHeaders}
                  />
                </div>
              )}
            <div>
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
                DNS record: <span className="font-mono">CNAME</span> {customer?.subdomain ?? "chat"} →{" "}
                <span className="font-mono">{cnameValue}</span>
              </p>
            </div>
          </div>
        )}

        {isPaid && !isWebsiteOrder && (
          <div ref={liveRef} className="mt-4 scroll-mt-24">
            {isLive && chatbotUrl && (
              <a
                href={chatbotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open live chatbot
              </a>
            )}
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
