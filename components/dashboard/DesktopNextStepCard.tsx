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
  copyCname: () => void;
  setActivePanel: (p: "training" | "design" | "domains") => void;
  handleCrawl: () => void;
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
  copyCname,
  setActivePanel,
  handleCrawl,
  handleGoLiveSuccess,
  authHeaders,
  orderDelivered,
}: DesktopNextStepCardProps) {
  if (!hasOrder || !customer) return null;

  if (isWebsiteOrder) {
    const payHref = websiteCheckoutHref;
    return (
      <Card className="border-border/80 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-none">
        <CardHeader className="pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current focus</p>
          <CardTitle className="text-lg">Website project</CardTitle>
          <CardDescription>
            {!isPaid
              ? "Complete payment to confirm your website package. We’ll email you to schedule kickoff."
              : orderDelivered
                ? "This project is marked complete. Reach out if you need anything else."
                : "We’re preparing your website build — watch your inbox for next steps from our team."}
          </CardDescription>
        </CardHeader>
        {!isPaid && (
          <CardContent className="pt-0">
            <Button asChild size="lg" className="w-full h-11 text-base font-semibold">
              <Link href={payHref}>Complete payment</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-none">
      <CardHeader className="pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Next step</p>
        <CardTitle className="text-lg">Keep your chatbot moving</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {!isPaid && (
          <>
            <CardDescription>
              Payment unlocks automatic crawling, training on your pages, and custom-domain deployment.
            </CardDescription>
            <Button asChild size="lg" className="w-full h-11 text-base font-semibold">
              <Link href={chatbotCheckoutHref}>Complete payment</Link>
            </Button>
          </>
        )}

        {isPaid && isLive && (
          <Button variant="cta" size="lg" className="w-full h-11 text-base font-semibold" asChild>
            <a href={`https://${customer.subdomain}.${customer.domain}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open your chatbot
            </a>
          </Button>
        )}

        {isPaid && !isLive && contentCount === 0 && ["crawling", "indexing"].includes(customerStatus) && (
          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Training in progress</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Usually 2–8 minutes. We&apos;ll email you when your content is ready — no action needed right now.
              </p>
            </div>
          </div>
        )}

        {isPaid && !isLive && contentCount === 0 && !["crawling", "indexing"].includes(customerStatus) && (
          <>
            <CardDescription>
              Start the first crawl so we can index your site and train your assistant.
            </CardDescription>
            <Button size="lg" className="w-full h-11 text-base font-semibold" onClick={handleCrawl} disabled={crawling}>
              {crawling ? "Starting…" : "Build my chatbot"}
            </Button>
          </>
        )}

        {isPaid && !isLive && contentCount > 0 && customerStatus === "dns_setup" && (
          <>
            <CardDescription>
              Add this CNAME at your DNS provider. When it propagates, tap the button and we&apos;ll attach your domain on
              Vercel.
            </CardDescription>
            <pre className="rounded-lg border border-border bg-muted/60 px-3 py-3 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
              {`Host: ${customer.subdomain}\nTarget: ${PUBLIC_CNAME_TARGET}`}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="flex-1 min-w-[140px]" onClick={copyCname}>
                {copied ? "Copied" : "Copy DNS record"}
              </Button>
              <Button type="button" variant="outline" className="flex-1 min-w-[140px]" onClick={() => setActivePanel("domains")}>
                Full instructions
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
          <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">Finishing domain setup</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                DNS is verified. We&apos;re completing SSL and routing — typically a few minutes.
              </p>
            </div>
          </div>
        )}

        {isPaid &&
          !isLive &&
          contentCount > 0 &&
          !["dns_setup", "testing", "delivered"].includes(customerStatus) && (
            <>
              <CardDescription>Open the Domain section when you&apos;re ready to add your CNAME and go live.</CardDescription>
              <Button size="lg" className="w-full h-11 text-base font-semibold" onClick={() => setActivePanel("domains")}>
                Set up domain
              </Button>
            </>
          )}
      </CardContent>
    </Card>
  );
}
