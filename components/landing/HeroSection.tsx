"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/DashboardMockup";

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
    const url = inputRef.current?.value?.trim();
    if (url) {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
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
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance text-foreground">
            AI chatbot for your website.
            <br />
            Pay once. No monthly fees.
          </h1>
          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto">
            We scan your site, train a custom AI on your content, and deploy it at chat.yourdomain.com. One upfront payment. Hosting included.
          </p>

          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="url"
                  placeholder="Enter your website URL"
                  list="scan-history"
                  className="w-full px-5 py-3 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  onChange={(e) => setUrlHint(getNormalizedHint(e.target.value))}
                />
                {urlHint && (
                  <p className="absolute left-5 top-full mt-1 text-xs text-muted-foreground">
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
                onClick={handleScan}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 shrink-0"
              >
                Scan your site
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">One-time payment • Your domain • Delivered in 3–10 days</p>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}
