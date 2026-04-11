"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { LIMITS, sanitizeWebsiteUrl, isValidUrl } from "@/lib/validation";

const SCAN_HISTORY_KEY = "forwardslash_scan_urls";
const MAX_HISTORY = 5;

function getNormalizedHint(url: string): string {
  if (!url.trim()) return "";
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const u = new URL(normalized);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return "";
  }
}

function getScanHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCAN_HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function addToScanHistory(url: string) {
  if (typeof window === "undefined") return;
  try {
    const host = url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/")[0];
    const history = getScanHistory().filter((h) => !h.includes(host));
    history.unshift(url);
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

type HeroSectionProps = {
  onScanClick?: (url: string) => void;
};

export function HeroSection({ onScanClick }: HeroSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlHint, setUrlHint] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getScanHistory());
  }, []);

  const handleScan = () => {
    const raw = inputRef.current?.value?.trim() ?? "";
    if (!raw) {
      inputRef.current?.focus();
      return;
    }
    const url = sanitizeWebsiteUrl(raw);
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    if (url && isValidUrl(normalized)) {
      addToScanHistory(normalized);
      setHistory(getScanHistory());
      onScanClick?.(normalized);
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <section id="scan" className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="inline-flex items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300/90 mb-6">
            Pay once · Hosting included
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-balance text-foreground">
            AI chatbot for your website.
            <br />
            <span className="italic font-normal text-foreground/95">Pay once. No monthly fees.</span>
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Train an intelligent assistant on your site content and serve it at{" "}
            <span className="text-foreground/90 font-medium">chat.yourdomain.com</span>. One upfront payment — no
            subscriptions.
          </p>

          <div className="mt-8 max-w-2xl mx-auto space-y-4">
            {/* Single bordered control: URL + primary action (Stitch-style) */}
            <div className="rounded-2xl border border-border/80 bg-card/60 p-1.5 shadow-sm backdrop-blur-sm flex flex-col sm:flex-row sm:items-stretch gap-1">
              <div className="flex-1 min-w-0 relative flex items-center">
                <input
                  ref={inputRef}
                  type="url"
                  placeholder="your-website.com"
                  list="scan-history"
                  maxLength={LIMITS.websiteUrl}
                  autoComplete="url"
                  className="w-full min-h-[48px] px-4 sm:px-5 py-3 rounded-xl border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  onChange={(e) => setUrlHint(getNormalizedHint(e.target.value))}
                />
                {urlHint && (
                  <p className="absolute left-4 top-full mt-1 text-xs text-muted-foreground text-left">
                    We&apos;ll scan: {urlHint}
                  </p>
                )}
                <datalist id="scan-history">
                  {history.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
              </div>
              <Button
                variant="cta"
                size="lg"
                onClick={handleScan}
                className="shrink-0 rounded-xl px-6 sm:px-8 h-12 sm:h-auto whitespace-nowrap"
              >
                Scan your site →
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" asChild className="border-border bg-background/80 hover:bg-muted/60">
                <Link href="/services">No website yet? Website + AI →</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              One-time payment • Your domain • Typical delivery 3–10 days
            </p>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
