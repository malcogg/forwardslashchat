"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/FadeInSection";

const INCLUDED = [
  "Up to 50 pages included",
  "AI trained on your content",
  "Hosting included",
  "Your domain (chat.yoursite.com or yoursite.com/chat)",
  "No monthly fees",
];

const tiers = [
  { name: "1-Year Starter", price: 550, years: 1, plan: "chatbot-1y" },
  { name: "2-Year Bundle", price: 850, years: 2, badge: "Recommended", plan: "chatbot-2y" },
  { name: "3-Year Bundle", price: 1250, years: 3, plan: "chatbot-3y" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-4xl mx-auto">
        <FadeInSection className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground">Simple pricing</h2>
          <p className="mt-4 text-muted-foreground">
            One upfront payment. Hosting included. Renewal optional at $495/year after.
          </p>
        </FadeInSection>

        <FadeInSection delay={100}>
        <div className="grid sm:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border bg-card p-6 flex flex-col ${
                tier.badge ? "border-emerald-500/50 shadow-md shadow-emerald-500/5" : "border-border"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs bg-emerald-600 text-white rounded-full">
                  {tier.badge}
                </span>
              )}
              <h3 className="font-medium text-foreground">{tier.name}</h3>
              <p className="mt-2 text-2xl font-semibold text-foreground">${tier.price}</p>
              <p className="text-sm text-muted-foreground">{tier.years} year{tier.years > 1 ? "s" : ""}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.badge ? "default" : "outline"}
                size="sm"
                className={`w-full mt-6 ${tier.badge ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" : ""}`}
              >
                <Link href={`/checkout?plan=${tier.plan}`}>Get started</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          +$99 optional: Help with DNS setup. Scan your site to see your recommended tier.
        </p>
        </FadeInSection>
      </div>
    </section>
  );
}
