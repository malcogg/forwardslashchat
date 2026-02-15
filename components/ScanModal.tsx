"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalStep = "scanning" | "results" | "pricing" | "error" | null;

const SCAN_MESSAGES = [
  "Reading your homepage...",
  "Looking at your services and pricing...",
  "Finding your blog and testimonials...",
  "Checking contact and booking info...",
  "Almost ready...",
];

const PAGE_TIERS = [
  { min: 0, max: 300, tier: "Small", price: 550, years: 1 },
  { min: 300, max: 1000, tier: "Medium", price: 850, years: 2 },
  { min: 1000, max: 5000, tier: "Large", price: 1250, years: 3 },
  { min: 5000, max: Infinity, tier: "Enterprise", price: null, years: null },
];

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  onScanComplete?: (url: string) => void;
}

export function ScanModal({ open, onClose, url, onScanComplete }: ScanModalProps) {
  const [step, setStep] = useState<ModalStep>("scanning");
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [categories, setCategories] = useState<{ label: string; count: number; on: boolean }[]>([]);
  const [dnsHelp, setDnsHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open || !url) return;

    setStep("scanning");
    setError(null);
    setProgress(0);

    const msgInterval = setInterval(
      () => setScanMessageIndex((i) => (i + 1) % SCAN_MESSAGES.length),
      800
    );

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setProgress((p) => Math.min(90, Math.floor(90 * (1 - Math.exp(-elapsed / 90)))));
    }, 500);

    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Scan failed");
        setProgress(100);
        setPageCount(data.pageCount);
        onScanComplete?.(data.url ? (data.url.startsWith("http") ? data.url : `https://${data.url}`) : url);
        setCategories(
          (data.categories ?? []).map((c: { label: string; count: number }) => ({
            ...c,
            on: true,
          }))
        );
        setStep("results");
      })
      .catch((e) => {
        setError(e.message ?? "Something went wrong. Please try again.");
        setStep("error");
      })
      .finally(() => {
        clearInterval(msgInterval);
        clearInterval(progressInterval);
      });

    return () => {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
    };
  }, [open, url, retryKey]);

  const toggleCategory = (label: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.label === label ? { ...c, on: !c.on } : c))
    );
  };

  const tier = PAGE_TIERS.find(
    (t) => pageCount >= t.min && pageCount < t.max
  ) ?? PAGE_TIERS[0];
  const totalPrice = tier.price ? tier.price + (dnsHelp ? 99 : 0) : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "scanning" && (
          <div className="p-12 text-center">
            <div className="animate-pulse w-12 h-12 mx-auto mb-6 rounded-full bg-zinc-700" />
            <p className="text-lg font-medium text-white mb-2">
              Scanning your site...
            </p>
            <p className="text-sm text-zinc-400 mb-4">
              {SCAN_MESSAGES[scanMessageIndex]}
            </p>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Typically 2–8 minutes for most sites
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-white mb-2">Scan failed</p>
            <p className="text-sm text-zinc-400 mb-6">{error}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {step === "results" && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Nice site! We found {pageCount} pages on {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Choose what to include in your chatbot:
            </p>
            <div className="space-y-3 mb-8">
              {categories.map((cat) => (
                <label
                  key={cat.label}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    cat.on
                      ? "bg-zinc-800 border-zinc-600"
                      : "bg-zinc-900/50 border-zinc-800 opacity-60"
                  )}
                >
                  <span className="text-white font-medium">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{cat.count} pages</span>
                    <input
                      type="checkbox"
                      checked={cat.on}
                      onChange={() => toggleCategory(cat.label)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800"
                    />
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep("pricing")}
              className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
              See Your Price
            </button>
          </div>
        )}

        {step === "pricing" && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Your Price
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Based on {pageCount} pages, we recommend the {tier.tier} tier.
            </p>
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-white">
                ${tier.price?.toLocaleString() ?? "Custom"} one-time
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                {tier.years != null ? `${tier.years}-year bundle • ` : ""}Hosting included
              </p>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 mb-6 cursor-pointer hover:bg-zinc-800/50">
              <input
                type="checkbox"
                checked={dnsHelp}
                onChange={(e) => setDnsHelp(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-white">+$99 Help me set up my domain (DNS)</span>
            </label>
            <p className="text-lg font-semibold text-white mb-4">
              Total: ${totalPrice.toLocaleString()}
            </p>
            <button
              className="w-full py-3 px-4 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
              onClick={() => window.location.href = "/dashboard"}
            >
              Continue to Payment
            </button>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              You&apos;ll be redirected to PayPal or Stripe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
