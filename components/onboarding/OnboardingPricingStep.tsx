"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPriceFromPagesAndYears, getTierFromPages, TIER_LABELS } from "@/lib/pricing";
import { playOnboardingClick } from "@/lib/onboarding-click-sound";
import { buildOnboardingCheckoutHref, normalizeCheckoutPages } from "@/lib/onboarding-checkout-url";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

type Props = {
  hasWebsitePath: boolean;
  websiteUrl: string;
  /** Pre-tick DNS add-on at checkout when user asked for DNS help in onboarding */
  preselectDnsAddon: boolean;
  onBack: () => void;
  onSaveAndGoDashboard: () => void;
  onSaveAndGoCheckout: (checkoutHref: string) => void;
  submitting: boolean;
  error: string | null;
};

export function OnboardingPricingStep({
  hasWebsitePath,
  websiteUrl,
  preselectDnsAddon,
  onBack,
  onSaveAndGoDashboard,
  onSaveAndGoCheckout,
  submitting,
  error,
}: Props) {
  const [years, setYears] = useState<1 | 2>(2);
  const [estimatedPages, setEstimatedPages] = useState(25);
  const [pagesLoading, setPagesLoading] = useState(() => hasWebsitePath && !!websiteUrl.trim());
  const [pagesFromScan, setPagesFromScan] = useState(false);

  useEffect(() => {
    if (!hasWebsitePath || !websiteUrl.trim()) {
      setEstimatedPages(25);
      setPagesLoading(false);
      setPagesFromScan(false);
      return;
    }
    let cancelled = false;
    setPagesLoading(true);
    const raw = websiteUrl.trim();
    const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
    fetch("/api/scan/roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: normalized }),
    })
      .then((r) => r.json())
      .then((data: { estimatedPages?: number }) => {
        if (cancelled) return;
        const ep = typeof data.estimatedPages === "number" ? data.estimatedPages : null;
        if (ep != null && ep >= 1) {
          setEstimatedPages(normalizeCheckoutPages(ep));
          setPagesFromScan(true);
        } else {
          setEstimatedPages(25);
          setPagesFromScan(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEstimatedPages(25);
          setPagesFromScan(false);
        }
      })
      .finally(() => {
        if (!cancelled) setPagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasWebsitePath, websiteUrl]);

  const uncapped = Math.max(1, Math.round(estimatedPages));
  const tierKey = getTierFromPages(uncapped);
  const contactUs = tierKey === "500+";
  const pages = normalizeCheckoutPages(uncapped);
  const price = !contactUs ? getPriceFromPagesAndYears(pages, years) : null;

  const checkoutHref = useMemo(
    () =>
      buildOnboardingCheckoutHref({
        pages,
        years,
        url: hasWebsitePath ? websiteUrl : null,
        preselectDns: preselectDnsAddon,
      }),
    [pages, years, hasWebsitePath, websiteUrl, preselectDnsAddon]
  );

  const click = () => playOnboardingClick();

  return (
    <motion.div
      key="pricing"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl"
    >
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Do more with your chatbot</h2>
        <p className="mt-2 text-sm text-neutral-500">Select a plan based on your site size — you can adjust on the next screen</p>
      </div>

      <div className="mt-8 min-h-[4.5rem] flex items-center justify-center">
        {pagesLoading ? (
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="h-5 w-5 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" aria-hidden />
            Estimating pages from your site…
          </div>
        ) : (
          <p className="text-sm text-neutral-600 text-center max-w-lg leading-relaxed">
            {pagesFromScan && hasWebsitePath
              ? `We estimate ~${pages} pages from your sitemap. Your full crawl may adjust this before checkout.`
              : hasWebsitePath
                ? "We couldn’t read a page count yet — showing typical small-site pricing (~25 pages). Checkout will update after your scan."
                : "When you connect a site, pricing follows page count. Here’s a typical estimate for getting started (~25 pages)."}
          </p>
        )}
      </div>

      {!contactUs && price != null && (
        <>
          <div className="mt-6 flex justify-center">
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => {
                  click();
                  setYears(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  years === 1 ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                1 year
              </button>
              <button
                type="button"
                onClick={() => {
                  click();
                  setYears(2);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  years === 2 ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                2 years
                <span className="ml-1.5 text-xs font-normal text-emerald-600">Best value</span>
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm max-w-md mx-auto text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {tierKey ? TIER_LABELS[tierKey] : "Your tier"}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">${price.toLocaleString()}</p>
            <p className="mt-2 text-sm text-neutral-500">
              One-time • {years}-year bundle • Hosting included
            </p>
            {preselectDnsAddon && (
              <p className="mt-3 text-xs text-neutral-500">
                DNS setup help (+$99) will be suggested at checkout based on your answers.
              </p>
            )}
          </div>
        </>
      )}

      {contactUs && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center max-w-md mx-auto">
          <p className="text-sm text-neutral-700">
            Large sites (500+ pages) need a quick scope call — we&apos;ll quote you accurately.
          </p>
          <Link
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={click}
            className="mt-4 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
          >
            Book a call
          </Link>
        </div>
      )}

      {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}

      <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
        {!contactUs && price != null && (
          <button
            type="button"
            disabled={submitting || pagesLoading}
            onClick={() => {
              click();
              onSaveAndGoCheckout(checkoutHref);
            }}
            className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {submitting ? "Saving…" : `Continue to checkout — $${price.toLocaleString()}`}
          </button>
        )}
        <button
          type="button"
          disabled={submitting}
          onClick={() => {
            click();
            onSaveAndGoDashboard();
          }}
          className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Explore dashboard first"}
        </button>
        <button type="button" onClick={onBack} disabled={submitting} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
          Back
        </button>
      </div>
    </motion.div>
  );
}
