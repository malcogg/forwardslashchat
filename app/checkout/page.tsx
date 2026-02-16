"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const scanId = searchParams.get("scanId") ?? undefined;
  const url = searchParams.get("url") ?? "";
  const pageCount = searchParams.get("pageCount") ?? "0";
  const years = searchParams.get("years") ?? "1";
  const dnsHelp = searchParams.get("dnsHelp") === "true";
  const amountCents = parseInt(searchParams.get("amountCents") ?? "0", 10);
  const total = searchParams.get("total") ?? "0";
  const hasParams = !!url && amountCents > 0;

  const [businessName, setBusinessName] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("chat");

  // Suggest domain from scanned URL
  useEffect(() => {
    if (url && !domain) {
      try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        setDomain(u.hostname.replace(/^www\./, ""));
      } catch {
        /* ignore */
      }
    }
  }, [url, domain]);

  const handleSubmit = async (e: React.FormEvent, useStripe = false) => {
    e.preventDefault();
    if (!businessName.trim() || !domain.trim()) {
      setError("Business name and domain are required");
      return;
    }

    setStatus("loading");
    setError(null);

    const payload = {
      scanId,
      amountCents,
      bundleYears: parseInt(years, 10) || 1,
      dnsHelp,
      businessName: businessName.trim(),
      domain: domain.trim(),
      subdomain: subdomain.trim() || "chat",
      websiteUrl: url.startsWith("http") ? url : `https://${url}`,
    };

    try {
      if (useStripe) {
        const res = await fetch("/api/checkout/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Checkout failed");
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      setOrderId(data.order?.id);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("form");
    }
  };

  if (status === "success" && orderId) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Order created</h1>
        <p className="text-muted-foreground mb-6">
          Your order has been created. (Payment integration coming soon.)
        </p>
        <Link
          href={`/dashboard?orderId=${orderId}`}
          className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90"
        >
          View Dashboard
        </Link>
      </div>
    );
  }

  if (!hasParams) {
    return (
      <main className="min-h-screen p-8 bg-background">
        <div className="max-w-lg mx-auto text-center py-16">
          <h1 className="text-xl font-bold text-foreground mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-6">
            Scan your website first to get your price, then continue to checkout.
          </p>
          <Link href="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-6">
          Total: ${total} • {years}-year bundle{dnsHelp ? " • DNS help included" : ""}
        </p>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-foreground mb-1">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-1 focus:ring-ring"
              placeholder="Your Business Inc"
              required
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
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-1 focus:ring-ring"
              placeholder="yourbusiness.com"
              required
            />
          </div>

          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-foreground mb-1">
              Chat subdomain
            </label>
            <input
              id="subdomain"
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:ring-1 focus:ring-ring"
              placeholder="chat"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your chatbot will live at {subdomain || "chat"}.{domain || "yourdomain.com"}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Creating order..." : "Create order (test mode)"}
          </button>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            className="w-full py-3 px-4 bg-[#635bff] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 mt-2"
          >
            Pay with Stripe
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Test mode creates the order without payment. Add STRIPE_SECRET_KEY to enable Pay with Stripe.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
