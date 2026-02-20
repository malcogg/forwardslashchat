"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/FadeInSection";
import {
  getPriceFromPagesAndYears,
  getTierFromPages,
  TIER_LABELS,
  type TierKey,
} from "@/lib/pricing";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

const INCLUDED = [
  "AI trained on your content",
  "Hosting included",
  "Your domain (chat.yoursite.com or yoursite.com/chat)",
  "No monthly fees",
];

const TIER_OPTIONS: { key: TierKey; pages: number; label: string }[] = [
  { key: "under50", pages: 25, label: "Up to 50 pages" },
  { key: "50-200", pages: 125, label: "51–200 pages" },
  { key: "200-500", pages: 350, label: "201–500 pages" },
  { key: "500+", pages: 500, label: "500+ pages" },
];

export function PricingSection() {
  const searchParams = useSearchParams();
  const pagesParam = searchParams.get("pages");
  const initialPages = pagesParam ? Math.min(500, Math.max(1, parseInt(pagesParam, 10) || 25)) : 25;

  const [years, setYears] = useState<1 | 2>(2);
  const [pages, setPages] = useState(initialPages);
  const [tierKey, setTierKey] = useState<TierKey>("under50");

  useEffect(() => {
    if (pagesParam) {
      const p = Math.min(500, Math.max(1, parseInt(pagesParam, 10) || 25));
      setPages(p);
      if (p >= 500) setTierKey("500+");
      else if (p > 200) setTierKey("200-500");
      else if (p > 50) setTierKey("50-200");
      else setTierKey("under50");
    }
  }, [pagesParam]);

  const handleTierChange = (opt: (typeof TIER_OPTIONS)[number]) => {
    if (opt.key === "500+") {
      setTierKey("500+");
      setPages(500);
    } else {
      setTierKey(opt.key);
      setPages(opt.pages);
    }
  };

  const isContactUs = pages >= 500;
  const price = !isContactUs ? getPriceFromPagesAndYears(pages, years) : null;

  return (
    <section id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-2xl mx-auto">
        <FadeInSection className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">Simple pricing</h2>
          <p className="mt-4 text-muted-foreground">
            One upfront payment. Hosting included. Price based on your site size.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
          <div className="relative rounded-xl border-2 border-emerald-500/50 bg-card p-8 shadow-lg shadow-emerald-500/5">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
              AI Chatbot
            </span>

            {/* Years selector */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-sm font-medium text-muted-foreground">Years</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setYears(1)}
                  disabled={years <= 1}
                  className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="1 year"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-semibold text-foreground">{years}</span>
                <button
                  type="button"
                  onClick={() => setYears(2)}
                  disabled={years >= 2}
                  className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="2 years"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">year{years > 1 ? "s" : ""}</span>
            </div>

            {/* Page tier selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                Site size (pages)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIER_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleTierChange(opt)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      tierKey === opt.key
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              {isContactUs ? (
                <p className="text-lg font-medium text-muted-foreground">
                  500+ pages — <span className="text-foreground">Contact us for a quote</span>
                </p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-foreground">${price?.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    one-time · {years} year{years > 1 ? "s" : ""} hosting
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {isContactUs ? (
              <Button asChild className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <a href={CAL_LINK} target="_blank" rel="noopener noreferrer">
                  Contact us for a quote
                </a>
              </Button>
            ) : (
              <Button asChild className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link
                  href={`/checkout?plan=chatbot-${years}y&pages=${pages}&amountCents=${(price ?? 0) * 100}`}
                >
                  Get started — ${price?.toLocaleString()}
                </Link>
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            +$99 optional: Help with DNS setup.{" "}
            <Link href="/#scan" className="text-emerald-600 hover:underline">
              Scan your site
            </Link>{" "}
            to see your page count.
          </p>
        </FadeInSection>
      </div>
    </section>
  );
}
