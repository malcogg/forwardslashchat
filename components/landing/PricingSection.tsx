"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPriceFromPagesAndYears } from "@/lib/pricing";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

const FEATURES = [
  "AI trained on your content",
  "Custom domain (chat.yoursite.com)",
  "Hosting included",
  "Unlimited queries",
  "No monthly fees",
] as const;

const TIERS = [
  { key: "starter", name: "Starter", pages: "Up to 50 pages", pageCount: 25, popular: false },
  { key: "growth", name: "Growth", pages: "51–200 pages", pageCount: 125, popular: true },
  { key: "pro", name: "Pro", pages: "201–500+ pages", pageCount: 350, popular: false },
] as const;

export function PricingSection() {
  const [years, setYears] = useState<1 | 2>(2);

  return (
    <section id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            One-Time Payment Plans
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
            Based on your site size. Hosting included. No monthly fees.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Term:</span>
            <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setYears(1)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  years === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1 yr
              </button>
              <button
                type="button"
                onClick={() => setYears(2)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  years === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2 yr
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {TIERS.map((tier) => {
            const price = tier.pageCount >= 500
              ? null
              : getPriceFromPagesAndYears(tier.pageCount, years);

            return (
              <div
                key={tier.key}
                className={`relative rounded-xl border border-border bg-card p-6 md:p-8 flex flex-col ${
                  tier.popular ? "ring-2 ring-primary/30 border-primary/30 md:-my-2 md:py-10 md:z-10 md:shadow-lg" : ""
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tier.pages}</p>
                  {tier.popular && (
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Best value</p>
                  )}
                </div>

                <div className="mb-6">
                  {price !== null ? (
                    <>
                      <p className="text-4xl md:text-5xl font-bold text-foreground">
                        ${price.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        One-time payment · {years} year{years > 1 ? "s" : ""} hosting included
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">Custom</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contact us for a quote
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {FEATURES.map((feature, i) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span className={i === FEATURES.length - 1 ? "font-semibold" : ""}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {price !== null ? (
                  <Button asChild variant="cta" size="lg" className="w-full">
                    <Link href={`/checkout?plan=chatbot-${years}y&pages=${tier.pageCount}`}>
                      Get Started — ${price.toLocaleString()}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="cta" size="lg" className="w-full">
                    <a href={CAL_LINK} target="_blank" rel="noopener noreferrer">
                      Contact us for a quote
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          +$99 optional: Help with DNS setup.{" "}
          <Link href="/#scan" className="text-primary hover:underline">
            Scan your site
          </Link>{" "}
          to see your page count.
        </p>
      </div>
    </section>
  );
}
