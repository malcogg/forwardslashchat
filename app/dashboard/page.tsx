"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CustomerChat } from "@/components/CustomerChat";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Payment confirmed",
  processing: "Processing",
  delivered: "Delivered",
  failed: "Failed",
  content_collection: "Content collection",
  crawling: "Crawling website",
  indexing: "Indexing content",
  dns_setup: "DNS setup",
  testing: "Testing",
};

const CHECKLIST = [
  "Payment confirmed",
  "Website scanned",
  "Content selected",
  "Bot trained",
  "DNS configured",
  "Chatbot live",
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [data, setData] = useState<{
    order: { id: string; status: string; amountCents: number; bundleYears: number; dnsHelp: boolean };
    customer: {
      id: string;
      businessName: string;
      domain: string;
      subdomain: string;
      websiteUrl: string;
      prepaidUntil: string | null;
      status: string;
      primaryColor: string | null;
    } | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch(() => setError("Could not load dashboard"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleCrawl = () => {
    if (!data?.customer?.id) return;
    setCrawling(true);
    fetch(`/api/customers/${data.customer.id}/crawl`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error("Crawl failed");
        return res.json();
      })
      .then(() => {
        setData((d) =>
          d?.customer
            ? { ...d, customer: { ...d.customer, status: "indexing" } }
            : d
        );
      })
      .catch(() => setCrawling(false))
      .finally(() => setCrawling(false));
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (error || (orderId && !data?.order)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error ?? "Order not found"}</p>
          <Link href="/" className="text-primary hover:underline">Back to home</Link>
        </div>
      </main>
    );
  }

  const order = data?.order;
  const customer = data?.customer;
  const hasOrder = !!order;
  const prepaidUntil = customer?.prepaidUntil ? new Date(customer.prepaidUntil) : null;
  const chatUrl = customer
    ? `${customer.subdomain}.${customer.domain}`
    : "chat.yourbusiness.com";

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← ForwardSlash.Chat
        </Link>
        <UserButton afterSignOutUrl="/" />
      </header>
      {/* 75% left panel | 25% right iPhone mockup */}
      <div className="flex h-[calc(100vh-52px)]">
        {/* Left: dashboard info - 75% */}
        <div className="flex-[3] overflow-y-auto p-6 lg:p-8 min-w-0">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

            {!hasOrder && (
              <p className="text-muted-foreground mb-6">
                Complete a checkout to see your order.{" "}
                <Link href="/checkout" className="text-primary hover:underline">Go to checkout</Link>
              </p>
            )}

            {hasOrder && (
              <>
                {/* Order Status */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Order Status</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        order.status === "paid" || order.status === "delivered"
                          ? "bg-green-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>{STATUS_LABELS[order.status] ?? order.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${(order.amountCents / 100).toLocaleString()} • {order.bundleYears}-year bundle
                    {order.dnsHelp ? " • DNS help included" : ""}
                  </p>
                </section>

                {/* Chatbot Details */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Your Chatbot</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><span className="text-foreground">Business:</span> {customer?.businessName}</li>
                    <li><span className="text-foreground">URL:</span> {chatUrl}</li>
                    <li><span className="text-foreground">Website:</span> {customer?.websiteUrl}</li>
                    <li><span className="text-foreground">Prepaid until:</span> {prepaidUntil?.toLocaleDateString()}</li>
                  </ul>
                  {customer && customer.status === "content_collection" && (
                    <button
                      onClick={handleCrawl}
                      disabled={crawling}
                      className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {crawling ? "Crawling your site..." : "Build my chatbot"}
                    </button>
                  )}
                </section>

                {/* DNS */}
                <section className="bg-card border border-border rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">DNS Setup</h2>
                  <p className="text-sm text-muted-foreground mb-4">Add this CNAME record:</p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {`Type: CNAME\nHost: ${customer?.subdomain ?? "chat"}\nValue: cname.forwardslash.chat`}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a>
                    {" · "}
                    <a href="https://www.godaddy.com/help/add-a-cname-record-19236" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a>
                  </p>
                </section>

                {/* Checklist */}
                <section className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Checklist</h2>
                  <ul className="space-y-2">
                    {CHECKLIST.map((item, i) => {
                      const done = i < 2;
                      return (
                        <li key={i} className="flex items-center gap-2 text-muted-foreground">
                          <span className={done ? "text-green-500" : ""}>{done ? "✓" : "○"}</span>
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </>
            )}
          </div>
        </div>

        {/* Right: iPhone mockup - 25% */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-6 border-l border-border bg-muted/30 min-w-[280px]">
          <div className="relative">
            {/* iPhone frame */}
            <div className="w-[260px] rounded-[2.5rem] border-[10px] border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
              <div className="rounded-[1.5rem] overflow-hidden bg-zinc-950">
                {/* Status bar notch */}
                <div className="h-6 bg-zinc-900 flex items-center justify-center">
                  <div className="w-20 h-4 rounded-full bg-zinc-800" />
                </div>
                {customer ? (
                  <CustomerChat
                    customerId={customer.id}
                    businessName={customer.businessName}
                    primaryColor={customer.primaryColor ?? "#6B4E3D"}
                    compact
                  />
                ) : (
                  <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
                    Complete checkout to preview your chatbot
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
