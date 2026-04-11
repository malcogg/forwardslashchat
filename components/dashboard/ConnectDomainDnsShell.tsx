"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GoLiveButton } from "@/components/dashboard/GoLiveButton";

const HELP_EMAIL = "hello@forwardslash.chat";

function DnsHelpFooter({ hasPaidDnsHelp }: { hasPaidDnsHelp: boolean }) {
  const subject = encodeURIComponent("DNS setup help");
  const mailto = `mailto:${HELP_EMAIL}?subject=${subject}`;

  if (hasPaidDnsHelp) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 mt-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          You purchased <span className="font-medium text-foreground">DNS setup help</span>. Email{" "}
          <a href={mailto} className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
            {HELP_EMAIL}
          </a>{" "}
          and we&apos;ll walk through your records with you (include your domain and the email you used at checkout).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-3 mt-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Stuck? Email{" "}
        <a href={mailto} className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2">
          {HELP_EMAIL}
        </a>{" "}
        for guidance on CNAMEs and common registrar steps. Hands-on DNS changes aren&apos;t included unless you added{" "}
        <span className="font-medium text-foreground">DNS setup help</span> at checkout.
      </p>
    </div>
  );
}

export type ConnectDomainDnsShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subdomain: string;
  domain: string;
  cnameTarget: string;
  /** When true, show full go-live / verify flow; otherwise CNAME instructions only. */
  showGoLive: boolean;
  hasPaidDnsHelp: boolean;
  customerId: string;
  customerDomain: string;
  authHeaders: () => Promise<HeadersInit>;
  onGoLiveSuccess: () => void | Promise<void>;
};

export function ConnectDomainDnsShell({
  open,
  onOpenChange,
  subdomain,
  domain,
  cnameTarget,
  showGoLive,
  hasPaidDnsHelp,
  customerId,
  customerDomain,
  authHeaders,
  onGoLiveSuccess,
}: ConnectDomainDnsShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const panel = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-domain-dns-title"
        className="fixed z-[201] flex flex-col bg-card border border-border shadow-2xl overflow-hidden
          max-md:inset-x-0 max-md:bottom-0 max-md:top-[12vh] max-md:rounded-t-2xl max-md:border-b-0
          md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[calc(100%-2rem)] md:max-w-md md:rounded-2xl md:max-h-[min(90dvh,640px)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <h2 id="connect-domain-dns-title" className="text-base font-semibold text-foreground pr-2">
            Connect your domain
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="max-md:mx-auto max-md:mt-1 max-md:h-1 max-md:w-10 max-md:rounded-full max-md:bg-muted-foreground/25 md:hidden" />

        <div className="overflow-y-auto overscroll-contain px-4 py-4 flex-1 min-h-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add this CNAME at your DNS host (often the same place you bought <span className="font-medium text-foreground">{domain}</span>
            ):
          </p>
          <p className="text-sm text-foreground mt-3">
            <span className="font-mono text-xs sm:text-sm break-all">
              {subdomain} → {cnameTarget}
            </span>
          </p>

          <p className="text-xs text-muted-foreground mt-4">
            <a
              href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              Cloudflare
            </a>
            {" · "}
            <a
              href="https://www.godaddy.com/help/add-a-cname-record-19236"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
            >
              GoDaddy
            </a>
          </p>

          {showGoLive ? (
            <div className="mt-6 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                After saving the record, verify below. We&apos;ll attach <span className="font-mono text-foreground">{customerDomain}</span> when DNS
                propagates.
              </p>
              <GoLiveButton
                customerId={customerId}
                customerDomain={customerDomain}
                onSuccess={onGoLiveSuccess}
                authHeaders={authHeaders}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              When indexing finishes, you&apos;ll be able to verify DNS and go live from here.
            </p>
          )}

          <DnsHelpFooter hasPaidDnsHelp={hasPaidDnsHelp} />
        </div>
      </div>
    </>
  );

  return createPortal(panel, document.body);
}
