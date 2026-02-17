"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
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

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";
const PAYPAL_ME_USER = "michael239";
const PHONE_NUMBER = "619-719-5932";

type AddOnId = "dns" | "ai-chatbot" | "logo" | "seo" | "blog";

const ADD_ONS: {
  id: AddOnId;
  label: string;
  price: number;
  description: string;
  forPlans?: PlanSlug[];
}[] = [
  {
    id: "dns",
    label: "DNS Setup Help",
    price: 99,
    description: "We handle the DNS records for you.",
  },
  {
    id: "ai-chatbot",
    label: "AI Chatbot Add-On",
    price: 550,
    description: "Add your custom AI assistant trained on your content — answers 24/7 on chat.yourdomain.com.",
    forPlans: ["starter"],
  },
  {
    id: "logo",
    label: "Logo Design",
    price: 150,
    description: "Custom logo + favicon (up to 5 concepts) to make your site look professional.",
  },
  {
    id: "seo",
    label: "Advanced SEO",
    price: 400,
    description: "For existing sites: keyword research, on-page optimizations, local schema. (New sites include basic SEO.)",
    forPlans: ["redesign", "chatbot", "chatbot-1y", "chatbot-2y", "chatbot-3y"],
  },
  {
    id: "blog",
    label: "Blog Setup",
    price: 365,
    description: "Full blog setup + 365 AI-generated posts ($1 per post). First-time customers only.",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planSlug = (searchParams.get("plan") ?? "starter") as PlanSlug;
  const plan = PLANS[planSlug] ?? PLANS.starter;

  const urlParam = searchParams.get("url") ?? searchParams.get("websiteUrl");
  const initialUrl = urlParam ? (urlParam.startsWith("http") ? urlParam : `https://${urlParam}`) : "";

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState(searchParams.get("businessName") ?? "");
  const [domain, setDomain] = useState(
    searchParams.get("domain") ?? urlParam?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(initialUrl);
  const [addOns, setAddOns] = useState<Set<AddOnId>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

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
  const addOnLabels = ADD_ONS.filter((a) => addOns.has(a.id)).map((a) => a.label);
  const paypalDescription =
    addOnLabels.length > 0
      ? `ForwardSlash.Chat - ${plan.name} + ${addOnLabels.join(", ")}`
      : `ForwardSlash.Chat - ${plan.name}`;
  const amount = subtotal.toFixed(2);
  const paypalLink = `https://www.paypal.com/paypalme/${PAYPAL_ME_USER}/${amount}?item_name=${encodeURIComponent(paypalDescription)}`;

  const detailsComplete =
    firstName.trim() &&
    email.trim() &&
    phone.trim() &&
    businessName.trim() &&
    domain.trim() &&
    websiteUrl.trim();

  const handlePay = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!detailsComplete || subtotal <= 0) return;

    setSaveError(null);
    try {
      const res = await fetch("/api/checkout/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          businessName: businessName.trim(),
          domain: domain.trim(),
          websiteUrl: websiteUrl.trim(),
          planSlug,
          addOns: Array.from(addOns),
          amountCents: Math.round(subtotal * 100),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to save");
      }
      window.location.href = paypalLink;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save. Please try again.");
    }
  };

  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">Fill in your details, pick add-ons, and complete your order.</p>

        {/* 1. Plan selector at top */}
        <div className="mb-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Select your plan</h2>
          <div className="flex flex-wrap gap-2">
            {(["starter", "new-build", "redesign", "chatbot", "chatbot-1y", "chatbot-2y", "chatbot-3y"] as PlanSlug[]).map(
              (slug) => {
                const p = PLANS[slug];
                const active = planSlug === slug;
                return (
                  <Link
                    key={slug}
                    href={`/checkout?plan=${slug}`}
                    className={`inline-flex px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-emerald-600 text-white" : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {p.name} — ${p.price}
                  </Link>
                );
              }
            )}
          </div>
        </div>

        {/* 2. Your details */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h2 className="font-serif text-lg font-medium text-foreground mb-4">Your details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Michael"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Business email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@yourbusiness.com"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(619) 555-0123"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
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
                Domain
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
            <div className="sm:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-foreground mb-1">
                Existing website URL
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

        {/* 3. Enhance your package */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <h2 className="font-serif text-lg font-medium text-foreground mb-1">Enhance your package</h2>
          <p className="text-sm text-muted-foreground mb-4">One-time add-ons — pick what fits.</p>
          <div className="space-y-3">
            {ADD_ONS.map((addOn) => {
              const available = !addOn.forPlans || addOn.forPlans.includes(planSlug);
              if (!available) return null;
              const checked = addOns.has(addOn.id);
              return (
                <label
                  key={addOn.id}
                  className={`flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        checked ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground/50"
                      }`}
                    >
                      {checked ? <Check className="w-3 h-3" /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground block break-words">{addOn.label}</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block break-words">{addOn.description}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground shrink-0 sm:pl-2">+${addOn.price.toLocaleString()}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAddOn(addOn.id)}
                    className="sr-only"
                  />
                </label>
              );
            })}
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">Extra Pages — Contact Us</span>
              <span className="text-xs text-muted-foreground">Need more pages? Message us for a custom quote.</span>
              <span className="text-sm text-primary shrink-0">→</span>
            </a>
          </div>
        </div>

        {/* 4. Order summary */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="font-serif text-lg font-medium text-foreground mb-6">Order summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-medium text-foreground">{plan.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
              </div>
              <span className="font-medium text-foreground whitespace-nowrap">${plan.price.toLocaleString()}</span>
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
              <span className="text-xl font-bold text-foreground">${subtotal.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Year 1 hosting included. One-time payment. No monthly fees.</p>

          {detailsComplete && subtotal > 0 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={handlePay}
                className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Pay with PayPal – ${subtotal.toLocaleString()} One-Time
              </button>
              <div className="mt-2 flex justify-center">
                <img
                  src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/buy-logo-small.png"
                  alt="PayPal"
                  className="h-5 w-auto opacity-80"
                />
              </div>
              {saveError && <p className="mt-2 text-sm text-destructive text-center">{saveError}</p>}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground text-center">
              Complete your details above to enable payment.
            </p>
          )}
        </div>

        {/* 5. Solo developer banner */}
        <div className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 p-6 mb-8">
          <p className="text-sm leading-relaxed">
            We are a solo developer helping businesses. If the price is too high to get started, call{" "}
            <a
              href={`tel:${PHONE_NUMBER.replace(/\D/g, "")}`}
              className="font-medium underline hover:no-underline"
            >
              Michael
            </a>{" "}
            — we can discuss a discount. {PHONE_NUMBER}
          </p>
        </div>

        {/* 6. Disclaimer + footer */}
        <p className="text-sm text-muted-foreground text-center mb-4">
          After payment, email{" "}
          <a href="mailto:hello@forwardslash.chat" className="text-primary hover:underline">
            hello@forwardslash.chat
          </a>{" "}
          with your business name, website URL, and order details to start setup.
        </p>
        <Link
          href="/services"
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to services
        </Link>
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
