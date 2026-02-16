"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/DashboardMockup";

type HeroSectionProps = {
  onScanClick?: (url: string) => void;
};

export function HeroSection({ onScanClick }: HeroSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = () => {
    const url = inputRef.current?.value?.trim();
    if (url) {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
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
              <input
                ref={inputRef}
                type="url"
                placeholder="Enter your website URL"
                className="flex-1 px-5 py-3 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
              />
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
