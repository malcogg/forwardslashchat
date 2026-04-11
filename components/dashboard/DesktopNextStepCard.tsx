"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoLiveButton } from "@/components/dashboard/GoLiveButton";

const PUBLIC_CNAME_TARGET = process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.vercel-dns.com";

export type DesktopNextStepCardProps = {
  isWebsiteOrder: boolean;
  hasOrder: boolean;
  customer: {
    id: string;
    subdomain: string;
    domain: string;
  } | null;
  isPaid: boolean;
  isLive: boolean;
  contentCount: number;
  customerStatus: string;
  crawling: boolean;
  copied: boolean;
  /** Chatbot SKU */
  chatbotCheckoutHref: string;
  /** Website SKU — same pattern as dashboard */
  websiteCheckoutHref: string;
  /** Quoted checkout total when unpaid (matches /checkout when possible) */
  unpaidQuoteDollars: number | null;
  copyCname: () => void;
  setActivePanel: (p: "training" | "design" | "domains" | "leads") => void;
  handleGoLiveSuccess: () => void | Promise<void>;
  authHeaders: () => Promise<HeadersInit>;
  orderDelivered?: boolean;
};

export function DesktopNextStepCard({
  isWebsiteOrder,
  hasOrder,
  customer,
  isPaid,
  isLive,
  contentCount,
  customerStatus,
  crawling,
  copied,
  chatbotCheckoutHref,
  websiteCheckoutHref,
  unpaidQuoteDollars,
  copyCname,
  setActivePanel,
  handleGoLiveSuccess,
  authHeaders,
  orderDelivered,
}: DesktopNextStepCardProps) {
  if (!hasOrder || !customer) return null;

  if (isWebsiteOrder) {
    const payHref = websiteCheckoutHref;
    return (
      <Card className="rounded-lg border-border/80 shadow-sm ring-1 ring-emerald-500/10 bg-card">
        <CardHeader className="p-3 pb-2 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next</p>
          <CardTitle className="text-lg font-semibold tracking-tight">Website project</CardTitle>
          <CardDescription className="text-xs leading-snug">
            {!isPaid
              ? "Complete payment to confirm your website package. We’ll email you to schedule kickoff."
              : orderDelivered
                ? "This project is marked complete. Reach out if you need anything else."
                : "We’re preparing your website build — watch your inbox for next steps from our team."}
          </CardDescription>
        </CardHeader>
        {!isPaid && (
          <CardContent className="p-3 pt-1">
            <Button asChild className="w-full h-11 text-sm font-semibold shadow-md">
              <Link href={payHref}>
                {unpaidQuoteDollars != null
                  ? `Complete payment — $${unpaidQuoteDollars.toLocaleString()}`
                  : "Complete payment"}
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border-border/80 shadow-sm ring-1 ring-emerald-500/10 bg-card">
      <CardHeader className="p-3 pb-2 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
        <CardTitle className="text-lg font-semibold tracking-tight">Finish setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-1">
        {!isPaid && (
          <>
            <CardDescription className="text-xs leading-snug text-muted-foreground">
              One checkout unlocks crawl, training, and custom domain.
            </CardDescription>
            <Button asChild className="w-full h-11 text-sm font-semibold shadow-md">
              <Link href={chatbotCheckoutHref}>
                {unpaidQuoteDollars != null
                  ? `Complete payment — $${unpaidQuoteDollars.toLocaleString()}`
                  : "Complete payment"}
              </Link>
            </Button>
          </>
        )}

        {isPaid && isLive && (
          <Button variant="cta" className="w-full font-semibold" asChild>
            <a href={`https://${customer.subdomain}.${customer.domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open your chatbot
            </a>
          </Button>
        )}

        {isPaid && !isLive && contentCount === 0 && ["crawling", "indexing"].includes(customerStatus) && (
          <div className="flex items-start gap-2.5 rounded-md border border-border/80 bg-muted/40 px-3 py-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Training in progress</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">~2–8 min. We&apos;ll email when ready.</p>
            </div>
          </div>
        )}

        {isPaid && !isLive && contentCount === 0 && !["crawling", "indexing"].includes(customerStatus) && (
          <CardDescription className="text-xs leading-snug">
            Start in <strong className="text-foreground font-medium">Training</strong> — use &quot;Build my chatbot&quot; below.
          </CardDescription>
        )}

        {isPaid && !isLive && contentCount > 0 && customerStatus === "dns_setup" && (
          <>
            <CardDescription className="text-xs leading-snug">
              Add CNAME at your DNS host, then verify.
            </CardDescription>
            <pre className="rounded-md border border-border bg-muted/60 px-2.5 py-2 text-[11px] font-mono text-foreground whitespace-pre-wrap leading-relaxed">
              {`Host: ${customer.subdomain}\nTarget: ${PUBLIC_CNAME_TARGET}`}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[120px]" onClick={copyCname}>
                {copied ? "Copied" : "Copy DNS"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 min-w-[120px]" onClick={() => setActivePanel("domains")}>
                Details
              </Button>
            </div>
            <GoLiveButton
              customerId={customer.id}
              customerDomain={`${customer.subdomain}.${customer.domain}`}
              onSuccess={handleGoLiveSuccess}
              authHeaders={authHeaders}
            />
          </>
        )}

        {isPaid && !isLive && contentCount > 0 && customerStatus === "testing" && (
          <div className="flex items-start gap-2.5 rounded-md border border-border/80 bg-muted/40 px-3 py-2.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Finishing SSL</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">DNS OK — routing updates in a few minutes.</p>
            </div>
          </div>
        )}

        {isPaid &&
          !isLive &&
          contentCount > 0 &&
          !["dns_setup", "testing", "delivered"].includes(customerStatus) && (
            <>
              <CardDescription className="text-xs leading-snug">Add your domain record when ready.</CardDescription>
              <Button className="w-full font-semibold" onClick={() => setActivePanel("domains")}>
                Open Domain
              </Button>
            </>
          )}
      </CardContent>
    </Card>
  );
}
