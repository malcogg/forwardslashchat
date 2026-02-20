"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sanitizeWebsiteUrl, isValidUrl, LIMITS } from "@/lib/validation";
import { getPriceFromPagesAndYears } from "@/lib/pricing";

export const PENDING_SCAN_URL_KEY = "forwardslash_pending_scan_url";
export const LAST_SCAN_KEY = "forwardslash_last_scan";

function saveLastScan(url: string, estimatedPages: number, displayUrl: string) {
  try {
    localStorage.setItem(
      LAST_SCAN_KEY,
      JSON.stringify({ url, estimatedPages, displayUrl, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

type ModalStep =
  | "enter-url"
  | "roasting"
  | "roast-results"
  | "signup-prompt"
  | "scanning"
  | "already-scanned"
  | "results"
  | "pricing"
  | "error"
  | null;

const TYPING_BUBBLES = [
  "Scanning your site...",
  "Finding your classic vibes...",
  "Preparing your roast...",
];
const TYPEWRITER_MS_PER_CHAR = 65;

const PAGE_TIERS = [
  { min: 0, max: 300, tier: "Small", price: 799, years: 1 },
  { min: 300, max: 1000, tier: "Medium", price: 1099, years: 2 },
  { min: 1000, max: 5000, tier: "Large", price: 2999, years: 1 },
  { min: 5000, max: Infinity, tier: "Enterprise", price: null, years: null },
];

type RoastData = {
  ageScore: number;
  reasons: string[];
  roastLevel: string;
  roastEmoji: string;
  url: string;
  estimatedPages?: number;
} | null;

const MIN_ROAST_DISPLAY_MS = 2500;
const BULLET_DELAY_MS = 400;

interface ScanModalProps {
  open: boolean;
  onClose: () => void;
  url: string;
  onScanComplete?: (url: string) => void;
  /** When "dashboard", shows URL input when url is empty and "Add to my projects" CTA */
  origin?: "homepage" | "dashboard";
  /** Called when user clicks "Add to my projects" (dashboard only). Create project and redirect. */
  onAddToDashboard?: (url: string, estimatedPages?: number) => void;
}

export function ScanModal({ open, onClose, url, onScanComplete, origin = "homepage", onAddToDashboard }: ScanModalProps) {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [enteredUrl, setEnteredUrl] = useState("");
  const [step, setStep] = useState<ModalStep>("enter-url");
  const [typingElapsedMs, setTypingElapsedMs] = useState(0);
  const [roastData, setRoastData] = useState<RoastData>(null);
  const [visibleReasonIndex, setVisibleReasonIndex] = useState(0);
  const [roastLevelVisible, setRoastLevelVisible] = useState(false);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [categories, setCategories] = useState<{ label: string; count: number; on: boolean }[]>([]);
  const [dnsHelp, setDnsHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);

  const effectiveUrl = url || enteredUrl;
  const displayUrl = effectiveUrl ? effectiveUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";
  const needsUrlInput = origin === "dashboard" && !url;

  // Save last scan when roast results are shown (for bell icon on homepage)
  useEffect(() => {
    if (origin !== "homepage" || step !== "roast-results" || !roastData || !effectiveUrl) return;
    const pages = roastData.estimatedPages ?? 25;
    saveLastScan(effectiveUrl, pages, displayUrl);
  }, [origin, step, roastData, effectiveUrl, displayUrl]);

  const handleContinueToScan = useCallback((estimatedPagesOverride?: number) => {
    if (!effectiveUrl) return;
    try {
      const payload = { url: effectiveUrl, estimatedPages: estimatedPagesOverride ?? roastData?.estimatedPages };
      sessionStorage.setItem(PENDING_SCAN_URL_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [effectiveUrl, roastData?.estimatedPages]);

  const handleSubmitUrl = useCallback(() => {
    const raw = urlInputRef.current?.value?.trim() ?? "";
    if (!raw) {
      urlInputRef.current?.focus();
      return;
    }
    const sanitized = sanitizeWebsiteUrl(raw);
    const normalized = sanitized.startsWith("http") ? sanitized : `https://${sanitized}`;
    if (!isValidUrl(normalized)) {
      urlInputRef.current?.focus();
      return;
    }
    setEnteredUrl(normalized);
    setStep("roasting");
    setError(null);
  }, []);

  // When modal opens: homepage with url → roasting; dashboard with empty url → enter-url; dashboard with url → roasting
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (url) {
      setEnteredUrl("");
      setStep("roasting");
      setRoastData(null);
      setVisibleReasonIndex(0);
      setRoastLevelVisible(false);
      setTypingElapsedMs(0);
    } else if (needsUrlInput) {
      setStep("enter-url");
      setEnteredUrl("");
    }
  }, [open, url, needsUrlInput]);

  // When entering URL and clicking Scan, we already set step to roasting in handleSubmitUrl
  // When step becomes roasting with enteredUrl, the roast effect will run

  // Roasting: typing ticker + call API
  useEffect(() => {
    if (step !== "roasting" || !effectiveUrl) return;

    const ticker = setInterval(() => {
      setTypingElapsedMs((m) => Math.min(m + 50, 15000)); // cap at 15s
    }, 50);

    const start = Date.now();
    const normalized = effectiveUrl.startsWith("http") ? effectiveUrl : `https://${effectiveUrl}`;

    fetch("/api/scan/roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalized }),
    })
      .then((res) => res.json())
      .then((data) => {
        const elapsed = Date.now() - start;
        const minWait = Math.max(0, MIN_ROAST_DISPLAY_MS - elapsed);

        setTimeout(() => {
          if (data.fallback || data.error) {
        setRoastData({
          ageScore: 0,
          reasons: ["Standard site setup"],
          roastLevel: "We couldn't peek at your site this time — no worries!",
          roastEmoji: "👋",
          url: displayUrl,
          estimatedPages: undefined,
        });
          } else {
            setRoastData({
              ageScore: data.ageScore ?? 0,
              reasons: Array.isArray(data.reasons) ? data.reasons : ["Standard site setup"],
              roastLevel: data.roastLevel ?? "Looking good!",
              roastEmoji: data.roastEmoji ?? "👍",
              url: data.url ?? displayUrl,
              estimatedPages: typeof data.estimatedPages === "number" ? data.estimatedPages : undefined,
            });
          }
          setStep("roast-results");
        }, minWait);
      })
      .catch(() => {
        setRoastData({
          ageScore: 0,
          reasons: ["Standard site setup"],
          roastLevel: "We couldn't peek this time — sign up for a full scan!",
          roastEmoji: "👋",
          url: displayUrl,
          estimatedPages: undefined,
        });
        setStep("roast-results");
      });

    return () => clearInterval(ticker);
  }, [step, effectiveUrl, displayUrl]);

  // Roast results: sequential bullet reveals
  useEffect(() => {
    if (step !== "roast-results" || !roastData) return;
    const reasons = roastData.reasons;
    if (reasons.length === 0) {
      setRoastLevelVisible(true);
      return;
    }
    const timer = setInterval(() => {
      setVisibleReasonIndex((i) => {
        if (i >= reasons.length - 1) {
          setRoastLevelVisible(true);
          clearInterval(timer);
          return i;
        }
        return i + 1;
      });
    }, BULLET_DELAY_MS);
    return () => clearInterval(timer);
  }, [step, roastData]);

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
      <div className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Enter URL (dashboard only, when no url provided) */}
        <AnimatePresence mode="wait">
          {step === "enter-url" && needsUrlInput && (
            <motion.div
              key="enter-url"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 sm:p-10"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Scan a new site
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter a website URL and we&apos;ll peek at it — age, tech vibes, and page estimate. Same flow as the homepage.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={urlInputRef}
                  type="url"
                  placeholder="https://example.com"
                  maxLength={LIMITS.websiteUrl}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitUrl()}
                  className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                />
                <button
                  onClick={handleSubmitUrl}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shrink-0"
                >
                  Scan
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                We&apos;ll run a light scan (no Firecrawl credits) and show you a quick roast + price estimate.
              </p>
            </motion.div>
          )}
          {(step === "roasting" || (step === "enter-url" && url)) && (
            <motion.div
              key="roasting"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="relative p-6 sm:p-10 pb-10 sm:pb-12 min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center overflow-hidden"
              style={{
                background: "radial-gradient(circle at 50% 35%, rgba(16,185,129,0.08) 0%, transparent 55%)",
              }}
            >
              {/* Pulsating orb */}
              <motion.div
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full shrink-0 mb-6 sm:mb-8"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                  boxShadow: "0 0 60px rgba(16,185,129,0.5)",
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Typing bubbles */}
              <div className="w-full max-w-sm space-y-2 flex flex-col items-start">
                {TYPING_BUBBLES.map((text, i) => {
                  const startMs = TYPING_BUBBLES.slice(0, i).reduce((s, t) => s + t.length * TYPEWRITER_MS_PER_CHAR, 0);
                  const charsToShow = Math.max(
                    0,
                    Math.min(
                      text.length,
                      Math.floor((typingElapsedMs - startMs) / TYPEWRITER_MS_PER_CHAR)
                    )
                  );
                  const visible = charsToShow > 0;
                  const displayText = text.slice(0, charsToShow);
                  if (!visible) return null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-muted/60 border border-border text-sm text-foreground text-left max-w-[85%]"
                    >
                      {displayText}
                      {charsToShow < text.length && (
                        <span className="inline-block w-2 h-4 ml-0.5 bg-emerald-500 animate-pulse align-middle" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-6">
                Analyzing {displayUrl}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roast results: sequential reveals with stagger */}
        <AnimatePresence mode="wait">
          {step === "roast-results" && roastData && (
            <motion.div
              key="roast-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="p-8"
            >
              <motion.h2
                className="text-xl font-semibold text-foreground mb-1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                We peeked at your site...
              </motion.h2>
              <motion.p
                className="text-sm text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Here&apos;s what we noticed:
              </motion.p>

              {/* Bullets with checkmarks (sequential) */}
              <div className="space-y-2 mb-6">
                {roastData.reasons.slice(0, visibleReasonIndex + 1).map((reason, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border transition-all duration-300",
                      i === visibleReasonIndex ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/30"
                    )}
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm text-foreground">{reason}</span>
                  </motion.div>
                ))}
              </div>

              {/* Roast level */}
              {roastLevelVisible && (
                <motion.div
                  className="mb-6 p-4 rounded-xl bg-muted/50 border border-border"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm font-medium text-foreground">
                    {roastData.roastEmoji} {roastData.roastLevel}
                  </p>
                </motion.div>
              )}

              {/* Value prop - AI chatbot focus */}
              {roastLevelVisible && (
                <motion.p
                  className="text-sm text-muted-foreground mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  Don&apos;t worry — old sites work great. We just make them smarter by adding our custom AI chatbot that knows your company.
                </motion.p>
              )}

              {/* CTA buttons */}
              {roastLevelVisible && (
                <motion.div
                  className="space-y-3 mb-6"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Add an AI chatbot to your site
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {origin === "dashboard" && onAddToDashboard && (
                    <button
                      onClick={() => {
                        onAddToDashboard?.(effectiveUrl, roastData.estimatedPages);
                        onClose();
                      }}
                      className="py-2.5 px-4 text-center text-sm font-medium rounded-2xl rounded-bl-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors order-first sm:order-first"
                    >
                      Add to my projects →
                    </button>
                  )}
                  {origin === "homepage" && (() => {
                    const pages = roastData?.estimatedPages ?? 25;
                    const price = getPriceFromPagesAndYears(pages, 2);
                    const checkoutHref = `/checkout?plan=chatbot-2y&pages=${pages}${effectiveUrl ? `&url=${encodeURIComponent(effectiveUrl)}` : ""}`;
                    return (
                      <Link
                        href={price !== null ? checkoutHref : "/#pricing"}
                        onClick={() => {
                          handleContinueToScan();
                          saveLastScan(effectiveUrl, pages, displayUrl);
                        }}
                        className="py-2.5 px-4 text-center text-sm font-medium rounded-2xl rounded-bl-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        {price !== null
                          ? `Pay $${price.toLocaleString()} (2-yr, ~${pages} pages) →`
                          : `~${pages} pages — Contact us`}
                      </Link>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* Disclaimer */}
            {roastLevelVisible && (
              <motion.p
                className="text-xs text-muted-foreground text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                Just having fun with tech signals — your business is awesome.
              </motion.p>
            )}

            {/* Signup CTA */}
            {roastLevelVisible && (
              <motion.div
                className="pt-4 border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Create a free account to see your full scan and get your AI chatbot.
                </p>
                <SignedOut>
                  <Link
                    href="/sign-up"
                    onClick={() => handleContinueToScan()}
                    className="inline-flex items-center justify-center w-full py-3 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
                  >
                    Create free account
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    onClick={() => handleContinueToScan()}
                    className="inline-flex items-center justify-center w-full py-3 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
                  >
                    Continue to dashboard
                  </Link>
                </SignedIn>
              </motion.div>
            )}
          </motion.div>
          )}
        </AnimatePresence>

        {step === "signup-prompt" && (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Ready to scan {displayUrl}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This scan may take a while depending on site size. You&apos;ll see the full status and AI chatbot after signing up.
              <br />
              <span className="font-medium text-foreground">Create a free account to continue and get your results.</span>
            </p>
            <SignedOut>
              <Link
                href="/sign-up"
                onClick={() => handleContinueToScan()}
                className="inline-flex items-center justify-center w-full py-3 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
              >
                Create free account
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                onClick={() => handleContinueToScan()}
                className="inline-flex items-center justify-center w-full py-3 px-6 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
              >
                Continue to dashboard
              </Link>
            </SignedIn>
          </div>
        )}

        {step === "scanning" && (
          <div className="p-12 text-center">
            <div className="animate-pulse w-12 h-12 mx-auto mb-6 rounded-full bg-muted" />
            <p className="text-lg font-medium text-foreground mb-2">
              Scanning your site...
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {["Reading your homepage...", "Looking at your services...", "Almost ready..."][scanMessageIndex]}
            </p>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Typically 2–8 minutes for most sites
            </p>
          </div>
        )}

        {step === "already-scanned" && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              We&apos;ve already scanned this site
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              We found a recent scan for {displayUrl} with {pageCount} pages.
              {scannedAt && ` Scanned ${new Date(scannedAt).toLocaleDateString()}.`}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setStep("results")}
                className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
              >
                Use existing results
              </button>
              <button
                onClick={() => setRetryKey((k) => k + 1)}
                className="w-full py-3 px-4 border border-border rounded-lg text-foreground font-medium hover:bg-accent transition-colors"
              >
                Rescan anyway
              </button>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="p-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">Scan failed</p>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
            >
              Try again
            </button>
          </div>
        )}

        {step === "results" && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nice site! We found {pageCount} pages on {displayUrl}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choose what to include in your chatbot:
            </p>
            <div className="space-y-3 mb-8">
              {categories.map((cat) => (
                <label
                  key={cat.label}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    cat.on
                      ? "bg-accent border-border"
                      : "bg-muted/50 border-border opacity-60"
                  )}
                >
                  <span className="text-foreground font-medium">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{cat.count} pages</span>
                    <input
                      type="checkbox"
                      checked={cat.on}
                      onChange={() => toggleCategory(cat.label)}
                      className="w-4 h-4 rounded border-border bg-muted"
                    />
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep("pricing")}
              className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
            >
              See Your Price
            </button>
          </div>
        )}

        {step === "pricing" && (
          <div className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your Price
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Based on {pageCount} pages, we recommend the {tier.tier} tier.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-foreground">
                ${tier.price?.toLocaleString() ?? "Custom"} one-time
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {tier.years != null ? `${tier.years}-year bundle • ` : ""}Hosting included
              </p>
            </div>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border mb-6 cursor-pointer hover:bg-accent">
              <input
                type="checkbox"
                checked={dnsHelp}
                onChange={(e) => setDnsHelp(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-foreground">+$99 Help me set up my domain (DNS)</span>
            </label>
            <p className="text-lg font-semibold text-foreground mb-4">
              Total: ${totalPrice.toLocaleString()}
            </p>
            <button
              className="w-full py-3 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-opacity"
              onClick={() => {
                const params = new URLSearchParams();
                if (scanId) params.set("scanId", scanId);
                params.set("pageCount", String(pageCount));
                params.set("url", effectiveUrl);
                params.set("years", String(tier.years ?? 1));
                params.set("dnsHelp", String(dnsHelp));
                params.set("total", String(totalPrice));
                params.set("amountCents", String((totalPrice ?? 0) * 100));
                window.location.href = `/checkout?${params.toString()}`;
              }}
            >
              Continue to Payment
            </button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              You&apos;ll be redirected to PayPal or Stripe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
