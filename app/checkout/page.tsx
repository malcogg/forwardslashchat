"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type PlanSlug = "starter" | "new-build" | "redesign" | "chatbot" | "chatbot-1y" | "chatbot-2y" | "chatbot-3y";

const PLANS: Record<PlanSlug, { name: string; price: number; description: string }> = {
  starter: {
    name: "Quick WordPress Starter",
    price: 350,
    description: "10 clean pages, mobile-ready, basic SEO, year 1 hosting included",
  },
  "new-build": {
    name: "Brand New Website Build",
    price: 1000,
    description: "Full custom site + AI chatbot, mobile-responsive, year 1 hosting",
  },
  redesign: {
    name: "Website Redesign / Refresh",
    price: 2000,
    description: "Modern redesign + AI chatbot, speed & SEO upgrades, year 1 hosting",
  },
  chatbot: {
    name: "AI Chatbot (1-Year Starter)",
    price: 550,
    description: "Custom AI trained on your site, chat.yourdomain.com, year 1 hosting",
  },
  "chatbot-1y": {
    name: "AI Chatbot (1-Year Starter)",
    price: 550,
    description: "Custom AI trained on your site, chat.yourdomain.com, year 1 hosting",
  },
  "chatbot-2y": {
    name: "AI Chatbot (2-Year Bundle)",
    price: 850,
    description: "Custom AI trained on your site, 2-year hosting included",
  },
  "chatbot-3y": {
    name: "AI Chatbot (3-Year Bundle)",
    price: 1250,
    description: "Custom AI trained on your site, 3-year hosting included",
  },
};

type AddOnId =
  | "dns"
  | "ai-chatbot"
  | "year2-hosting"
  | "logo"
  | "seo"
  | "extra-pages"
  | "priority"
  | "blog";

const ADD_ONS: { id: AddOnId; label: string; price: number; forPlans?: PlanSlug[]; tooltip?: string }[] = [
  { id: "dns", label: "DNS setup help", price: 99, tooltip: "We'll help you add the CNAME record to connect your domain." },
  { id: "ai-chatbot", label: "AI Chatbot add-on", price: 200, forPlans: ["starter"], tooltip: "Add our custom AI trained on your site content. Chat at chat.yourdomain.com." },
  { id: "year2-hosting", label: "Year 2 hosting (optional)", price: 200, tooltip: "Extend hosting for another year after your initial period." },
  { id: "logo", label: "Logo design", price: 150, tooltip: "Custom logo creation to match your brand." },
  { id: "seo", label: "Advanced SEO", price: 150, tooltip: "On-page optimization, meta tags, and schema markup." },
  { id: "extra-pages", label: "Extra 5 pages", price: 75, tooltip: "Five additional pages beyond your plan's included count." },
  { id: "priority", label: "Priority delivery (5-day turnaround)", price: 100, tooltip: "Jump the queue — delivered within 5 business days." },
  { id: "blog", label: "Blog setup", price: 100, tooltip: "Blog section with categories and RSS." },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planSlug = (searchParams.get("plan") ?? "starter") as PlanSlug;
  const plan = PLANS[planSlug] ?? PLANS.starter;

  const [addOns, setAddOns] = useState<Set<AddOnId>>(new Set());
  const urlParam = searchParams.get("url") ?? searchParams.get("websiteUrl");
  const initialUrl = urlParam ? (urlParam.startsWith("http") ? urlParam : `https://${urlParam}`) : "";
  const [businessName, setBusinessName] = useState(searchParams.get("businessName") ?? "");
  const [domain, setDomain] = useState(searchParams.get("domain") ?? urlParam?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl);

  const toggleAddOn = (id: AddOnId) => {
    const addOn = ADD_ONS.find((a) => a.id === id);
    if (!addOn) return;
    if (addOn.forPlans && !addOn.forPlans.includes(planSlug)) return;
    setAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addOnsTotal = ADD_ONS.reduce((sum, a) => (addOns.has(a.id) ? sum + a.price : sum), 0);
  const subtotal = plan.price + addOnsTotal;

  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">Review your selection and add optional services.</p>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column: Add-ons + form */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-medium text-foreground mb-4">Add-on services</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Enhance your package with these optional services.
              </p>
              <div className="space-y-3">
                {ADD_ONS.map((addOn) => {
                  const available =
                    !addOn.forPlans || addOn.forPlans.includes(planSlug);
                  if (!available) return null;
                  const checked = addOns.has(addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      title={addOn.tooltip}
                      className={`flex items-center justify-between gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checked
                          ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                            checked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-muted-foreground/50"
                          }`}
                        >
                          {checked ? <Check className="w-3 h-3" /> : null}
                        </span>
                        <span className="text-sm font-medium text-foreground">{addOn.label}</span>
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        +${addOn.price.toLocaleString()}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddOn(addOn.id)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-medium text-foreground mb-4">Your details</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="business" className="block text-sm font-medium text-foreground mb-1">
                    Business name
                  </label>
                  <input
                    id="business"
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Acme Plumbing"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-foreground mb-1">
                    Domain {planSlug === "chatbot" ? "(e.g. acme.com)" : "(optional)"}
                  </label>
                  <input
                    id="domain"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourbusiness.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1">
                    Existing website URL {planSlug === "redesign" || planSlug === "chatbot" ? "" : "(optional)"}
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourcurrentsite.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Order summary */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-serif text-lg font-medium text-foreground mb-6">Order summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-foreground">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                  <span className="font-medium text-foreground whitespace-nowrap">
                    ${plan.price.toLocaleString()}
                  </span>
                </div>

                {addOns.size > 0 && (
                  <div className="pt-4 border-t border-border space-y-2">
                    {ADD_ONS.filter((a) => addOns.has(a.id)).map((addOn) => (
                      <div key={addOn.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{addOn.label}</span>
                        <span className="text-foreground">+${addOn.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Year 1 hosting included. One-time payment. No monthly fees.
              </p>

              <Button
                asChild
                className="mt-6 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base"
              >
                <a href="#">Proceed to payment</a>
              </Button>

              <Link
                href="/services"
                className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to services
              </Link>
            </div>
          </div>
        </div>

        {/* Change plan links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Switch to a different plan:</p>
          <div className="flex flex-wrap gap-3">
            {(["starter", "new-build", "redesign", "chatbot", "chatbot-1y", "chatbot-2y", "chatbot-3y"] as PlanSlug[]).map((slug) => {
              const p = PLANS[slug];
              const active = planSlug === slug;
              return (
                <Link
                  key={slug}
                  href={`/checkout?plan=${slug}`}
                  className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {p.name} — ${p.price}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="py-20 px-6 text-center text-muted-foreground">Loading...</div>}>
        <CheckoutContent />
      </Suspense>
      <Footer />
    </main>
  );
}
