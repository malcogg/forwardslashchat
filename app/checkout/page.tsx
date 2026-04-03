"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Check } from "lucide-react";
import {
  LIMITS,
  isValidEmail,
  sanitizeFirstName,
  sanitizePhone,
  sanitizeBusinessName,
  sanitizeDomain,
  sanitizeWebsiteUrl,
} from "@/lib/validation";
import { getPriceFromPagesAndYears } from "@/lib/pricing";
import { computeCheckoutAmountCents, type CheckoutPlanSlug } from "@/lib/checkout-pricing";

function safeInitialUrl(param: string | null): string {
  if (!param?.trim()) return "";
  const raw = param.trim().startsWith("http") ? param.trim() : `https://${param.trim()}`;
  return sanitizeWebsiteUrl(raw).slice(0, LIMITS.websiteUrl);
}

type PlanSlug = "chatbot-1y" | "chatbot-2y" | "starter" | "starter-bot" | "new-build" | "redesign";

const CHATBOT_DESCRIPTION = "Custom AI trained on your site, chat.yourdomain.com. Hosting included. One-time payment.";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";
const PHONE_NUMBER = "619-719-5932";

const WEBSITE_PLANS: {
  slug: PlanSlug;
  name: string;
  price: number;
  description: string;
}[] = [
  {
    slug: "starter",
    name: "Quick WordPress Starter",
    price: 350,
    description: "10 clean pages, mobile-ready, basic SEO, year 1 hosting included.",
  },
  {
    slug: "new-build",
    name: "Brand New Website Build",
    price: 1000,
    description: "Full custom site + mobile-responsive, year 1 hosting.",
  },
  {
    slug: "redesign",
    name: "Website Redesign / Refresh",
    price: 2000,
    description: "Modern redesign, speed & SEO upgrades, year 1 hosting.",
  },
];

type AddOnId = "dns" | "starter" | "new-build" | "redesign" | "social-media";

const ADD_ONS_CHATBOT: { id: AddOnId; label: string; price: number; description: string }[] = [
  { id: "dns", label: "DNS Setup Help", price: 99, description: "We handle the DNS records for you." },
  { id: "starter", label: "Quick WordPress Starter", price: 350, description: "10 clean pages, mobile-ready, basic SEO, year 1 hosting included." },
  { id: "new-build", label: "Brand New Website Build", price: 1000, description: "Full custom site + mobile-responsive, year 1 hosting." },
  { id: "redesign", label: "Website Redesign / Refresh", price: 2000, description: "Modern redesign, speed & SEO upgrades, year 1 hosting." },
  {
    id: "social-media",
    label: "Social Media Management",
    price: 599,
    description: "First month $599 (setup, planning, customer interaction). Then $400/month. 3 posts/day on all social accounts. We create images, videos, branding.",
  },
];

const ADD_ONS_WEBSITE: { id: AddOnId; label: string; price: number; description: string }[] = [
  { id: "dns", label: "DNS Setup Help", price: 99, description: "We handle the DNS records for you." },
  {
    id: "social-media",
    label: "Social Media Management",
    price: 599,
    description: "First month $599 (setup, planning, customer interaction). Then $400/month. 3 posts/day on all social accounts. We create images, videos, branding.",
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      fetch("/api/checkout/visit", { method: "POST", credentials: "include" }).catch(() => {});
    }
  }, [isSignedIn]);

  const planParam = searchParams.get("plan");
  const isStarterBot = planParam === "starter-bot";
  const isWebsitePlan =
    planParam === "starter" || planParam === "new-build" || planParam === "redesign";
  const websitePlan = WEBSITE_PLANS.find((p) => p.slug === planParam);

  const yearsParam = searchParams.get("years");
  const years: 1 | 2 = yearsParam === "1" ? 1 : 2;
  const pagesParam = searchParams.get("pages");
  const pages = pagesParam ? Math.min(499, Math.max(1, parseInt(pagesParam, 10) || 25)) : 25;
  const chatbotPlanSlug: PlanSlug = years === 2 ? "chatbot-2y" : "chatbot-1y";
  const chatbotPrice = getPriceFromPagesAndYears(pages, years) ?? 799;

  const effectivePlanSlug: PlanSlug = isStarterBot
    ? "starter-bot"
    : isWebsitePlan && websitePlan
      ? websitePlan.slug
      : chatbotPlanSlug;

  const plan = isStarterBot
    ? {
        name: "Starter — 5 pages, 1 year",
        description: "AI chatbot for very small sites. Company info, hours, contact. 1 year hosting included.",
        price: 129,
      }
    : isWebsitePlan && websitePlan
      ? {
          name: websitePlan.name,
          description: websitePlan.description,
          price: websitePlan.price,
        }
      : {
          name: `AI Chatbot — ${years}-year, ~${pages} pages`,
          description: CHATBOT_DESCRIPTION,
          price: chatbotPrice,
        };

  const addOnsList = isWebsitePlan && websitePlan ? ADD_ONS_WEBSITE : ADD_ONS_CHATBOT;
  const showChatbotPlanSelector = !isStarterBot && !isWebsitePlan;

  const setCheckoutYears = (y: 1 | 2) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("years", String(y));
    params.set("plan", y === 2 ? "chatbot-2y" : "chatbot-1y");
    if (!params.has("pages")) params.set("pages", String(pages));
    router.replace(`/checkout?${params.toString()}`, { scroll: false });
  };

  const setWebsitePlan = (slug: PlanSlug) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("plan", slug);
    router.replace(`/checkout?${params.toString()}`, { scroll: false });
  };

  const urlParam = searchParams.get("url") ?? searchParams.get("websiteUrl");
  const initialUrl = urlParam ? (urlParam.startsWith("http") ? urlParam : `https://${urlParam}`) : "";

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState(
    () => sanitizeBusinessName(searchParams.get("businessName") ?? "")
  );
  const [domain, setDomain] = useState(
    () => sanitizeDomain(searchParams.get("domain") ?? urlParam ?? "")
  );
  const [websiteUrl, setWebsiteUrl] = useState(() => safeInitialUrl(urlParam ?? searchParams.get("websiteUrl")));
  const [addOns, setAddOns] = useState<Set<AddOnId>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const toggleAddOn = (id: AddOnId) => {
    setAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Same calculation as POST /api/checkout/stripe — single source for UI total and pay eligibility */
  const checkoutQuote = useMemo(() => {
    try {
      return computeCheckoutAmountCents({
        planSlug: effectivePlanSlug as CheckoutPlanSlug,
        addOns: Array.from(addOns),
        pages: isStarterBot ? 5 : !isWebsitePlan ? pages : undefined,
      });
    } catch {
      return null;
    }
  }, [effectivePlanSlug, addOns, isStarterBot, isWebsitePlan, pages]);

  const orderTotalDollars =
    checkoutQuote != null ? checkoutQuote.amountCents / 100 : null;
  const selectedAddonTotal = addOnsList.reduce(
    (sum, a) => (addOns.has(a.id) ? sum + a.price : sum),
    0
  );
  const planLineDollars =
    orderTotalDollars != null ? Math.max(0, orderTotalDollars - selectedAddonTotal) : plan.price;

  const emailValid = !email.trim() || isValidEmail(email);
  const detailsComplete =
    firstName.trim() &&
    email.trim() &&
    emailValid &&
    phone.trim() &&
    businessName.trim() &&
    domain.trim() &&
    websiteUrl.trim();

  const [isPaying, setIsPaying] = useState(false);
  const payInFlightRef = useRef(false);

  const handlePay = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      !detailsComplete ||
      orderTotalDollars == null ||
      orderTotalDollars <= 0 ||
      isPaying ||
      payInFlightRef.current
    )
      return;

    setSaveError(null);
    setIsPaying(true);
    payInFlightRef.current = true;
    try {
      const orderId = searchParams.get("orderId");
      const token = isSignedIn ? await getToken() : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers,
        body: JSON.stringify({
          firstName: sanitizeFirstName(firstName),
          email: email.trim().toLowerCase().slice(0, LIMITS.email),
          phone: sanitizePhone(phone),
          businessName: sanitizeBusinessName(businessName),
          domain: sanitizeDomain(domain),
          websiteUrl: sanitizeWebsiteUrl(websiteUrl),
          planSlug: effectivePlanSlug,
          addOns: Array.from(addOns),
          pages: isStarterBot ? 5 : (!isWebsitePlan ? pages : undefined),
          orderId: orderId || undefined,
        }),
        credentials: "include",
        cache: "no-store",
      });

      // Use text() + JSON.parse instead of res.json() — avoids "Response body object should not be disturbed or locked"
      // in some browsers when extensions or runtimes touch the stream (see Chromium #1527291 class issues).
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Failed to start checkout");
      }
      const url = typeof data.url === "string" ? data.url : "";
      if (url) {
        window.location.assign(url);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not start checkout. Please try again.");
      setIsPaying(false);
      payInFlightRef.current = false;
    }
  };

  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">Checkout</h1>

        {/* Dynamic plan at top — website, starter-bot, or chatbot */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          {isStarterBot ? (
            <>
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Starter</h2>
              <p className="text-sm text-muted-foreground mb-2">
                $129 — AI chatbot for very small sites (up to 5 pages). 1 year hosting included.
              </p>
              <p className="text-sm font-medium text-foreground">
                <strong>Starter — 5 pages, 1 year</strong> — $129
              </p>
              <Link href="/#pricing" className="text-sm text-primary hover:underline mt-2 inline-block">
                View all plans →
              </Link>
            </>
          ) : isWebsitePlan && websitePlan ? (
            <>
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">Your website plan</h2>
              <p className="text-sm text-muted-foreground mb-4">Select a different plan or continue with your selection:</p>
              <div className="flex flex-wrap gap-2">
                {WEBSITE_PLANS.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setWebsitePlan(p.slug)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      websitePlan.slug === p.slug
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                        : "border-border hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p.name} — ${p.price.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <strong className="text-foreground">{websitePlan.name}</strong> — ${websitePlan.price.toLocaleString()}
              </p>
            </>
          ) : showChatbotPlanSelector ? (
            <>
              <h2 className="font-serif text-lg font-medium text-foreground mb-1">AI Chatbot</h2>
              <p className="text-sm text-muted-foreground mb-4">~{pages} pages from your site. Choose your term:</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setCheckoutYears(1)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${years === 1 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    1 year — ${getPriceFromPagesAndYears(pages, 1)?.toLocaleString() ?? "—"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutYears(2)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${years === 2 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    2 years — ${getPriceFromPagesAndYears(pages, 2)?.toLocaleString() ?? "—"}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Your details */}
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
                onChange={(e) => setFirstName(sanitizeFirstName(e.target.value))}
                placeholder="Michael"
                maxLength={LIMITS.firstName}
                autoComplete="given-name"
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
                onChange={(e) => setEmail(e.target.value.slice(0, LIMITS.email))}
                onBlur={() => setEmailTouched(true)}
                placeholder="hello@yourbusiness.com"
                maxLength={LIMITS.email}
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {emailTouched && email.trim() && !emailValid && (
                <p className="mt-1 text-xs text-destructive">Enter a valid email address</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                placeholder="(619) 555-0123"
                maxLength={LIMITS.phone}
                autoComplete="tel"
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
                onChange={(e) => setBusinessName(sanitizeBusinessName(e.target.value))}
                placeholder="Acme Plumbing"
                maxLength={LIMITS.businessName}
                autoComplete="organization"
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
                onChange={(e) => setDomain(sanitizeDomain(e.target.value))}
                placeholder="yourbusiness.com"
                maxLength={LIMITS.domain}
                autoComplete="off"
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
                onChange={(e) => setWebsiteUrl(e.target.value.slice(0, LIMITS.websiteUrl))}
                placeholder="https://yourcurrentsite.com"
                maxLength={LIMITS.websiteUrl}
                autoComplete="url"
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
            {addOnsList.map((addOn) => {
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
              <span className="font-medium text-foreground whitespace-nowrap">${planLineDollars.toLocaleString()}</span>
            </div>
            {addOns.size > 0 && (
              <div className="pt-4 border-t border-border space-y-2">
                {addOnsList.filter((a) => addOns.has(a.id)).map((addOn) => (
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
                ${orderTotalDollars != null ? orderTotalDollars.toLocaleString() : "—"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Hosting included. One-time payment. No monthly fees.</p>
          {isWebsitePlan && websitePlan ? (
            <p className="text-xs text-muted-foreground mt-2">
              After payment, you&apos;ll get a confirmation page and we&apos;ll email you to kick off your website project. Create an account anytime to see this order on your dashboard.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">
              After payment, we automatically crawl and train your chatbot (usually about{" "}
              <span className="text-foreground font-medium">5–15 minutes</span>
              ). Your dashboard shows live progress; we also email you when your content is ready and when to add your DNS record for{" "}
              <span className="text-foreground font-medium">chat.yourdomain.com</span>.{" "}
              <Link href="/thank-you" className="text-primary hover:underline">
                After checkout
              </Link>
              , create an account to track everything.
            </p>
          )}

          {detailsComplete && orderTotalDollars != null && orderTotalDollars > 0 ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={handlePay}
                disabled={isPaying}
                className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {isPaying
                  ? "Redirecting to checkout…"
                  : `Pay $${orderTotalDollars.toLocaleString()} — Secure checkout`}
              </button>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Secured by Stripe. Card payment. One-time charge.
              </p>
              {saveError && <p className="mt-2 text-sm text-destructive text-center">{saveError}</p>}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground text-center">
              {checkoutQuote == null && detailsComplete
                ? "This plan selection can’t be priced. Adjust pages or add-ons, or contact us for a custom quote."
                : "Complete your details above to enable payment."}
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
          Questions? Email{" "}
          <a href="mailto:hello@forwardslash.chat" className="text-primary hover:underline">
            hello@forwardslash.chat
          </a>
          . After payment, create an account to track your order.
        </p>
        <Link
          href="/"
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to home
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
