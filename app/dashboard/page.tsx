"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
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

function getDisplayName(user: { firstName?: string | null; lastName?: string | null; fullName?: string | null } | null | undefined): string {
  if (!user) return "Michael Francis";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.fullName) return user.fullName;
  return "Michael Francis";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function DashboardContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const [activePanel, setActivePanel] = useState<"design" | "domains" | "order">("design");

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
    contentCount?: number;
  } | null>(null);
  const [myOrders, setMyOrders] = useState<{ order: { id: string }; customer: { businessName: string; websiteUrl: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [credits, setCredits] = useState<{ remaining: number; creditsLimit: number } | null>(null);

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

  useEffect(() => {
    fetch("/api/orders/me")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyOrders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then(setCredits)
      .catch(() => {});
  }, []);

  const handleCrawl = () => {
    if (!data?.customer?.id) return;
    setCrawling(true);
    fetch(`/api/customers/${data.customer.id}/crawl`, { method: "POST" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Crawl failed");
        setData((d) =>
          d?.customer
            ? {
                ...d,
                customer: { ...d.customer, status: "dns_setup" },
                contentCount: json.pages ?? (d.contentCount ?? 0),
              }
            : d
        );
        const [dashRes, creditsRes] = await Promise.all([
          fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`),
          fetch("/api/credits"),
        ]);
        if (dashRes.ok) setData(await dashRes.json());
        if (creditsRes.ok) setCredits(await creditsRes.json());
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
  const chatUrl = customer ? `${customer.subdomain}.${customer.domain}` : "chat.yourbusiness.com";
  const contentCount = data?.contentCount ?? 0;

  // No order - minimal layout
  if (!hasOrder) {
    return (
      <main className="min-h-screen bg-background">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            ← ForwardSlash.Chat
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">Admin</Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
        <div className="p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-foreground mb-4">Dashboard</h1>
          <p className="text-muted-foreground mb-6">
            Complete a checkout to see your order.{" "}
            <Link href="/checkout" className="text-primary hover:underline">Go to checkout</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← ForwardSlash.Chat
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">Admin</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border bg-muted/20 p-4 flex flex-col shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-medium">{initials}</span>
            </div>
            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          </div>

          {myOrders.length > 1 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Your sites</p>
              {myOrders.map(({ order: o, customer: c }) => (
                <Link
                  key={o.id}
                  href={`/dashboard?orderId=${o.id}`}
                  className={`block px-2 py-1.5 text-sm rounded truncate ${
                    orderId === o.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {c?.businessName ?? c?.websiteUrl?.replace(/^https?:\/\//, "") ?? "Order"}
                </Link>
              ))}
            </div>
          )}

          <nav className="space-y-0.5 flex-1">
            {customer?.websiteUrl && (
              <a
                href={customer.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 rounded hover:text-foreground"
              >
                <span>▸</span> View site
              </a>
            )}
            <button
              onClick={() => setActivePanel("design")}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${
                activePanel === "design" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span>◉</span> Design
            </button>
            <button
              onClick={() => setActivePanel("domains")}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${
                activePanel === "domains" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span>⊕</span> Domains
            </button>
            <button
              onClick={() => setActivePanel("order")}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${
                activePanel === "order" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span>$</span> Order
            </button>
          </nav>

          <div className="pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground">Content pages</div>
            <div className="text-sm text-foreground">{contentCount} crawled</div>
            {credits && (
              <div className="text-xs text-muted-foreground mt-1">
                {credits.remaining} / {credits.creditsLimit} credits
              </div>
            )}
          </div>
        </aside>

        {/* Main content: Design panel or Domains/Order */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {activePanel === "design" && (
            <div className="w-72 border-r border-border bg-background p-4 overflow-y-auto shrink-0 hidden lg:block">
              <h3 className="font-medium text-foreground mb-4">Chatbot</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Business name</label>
                  <div className="text-sm text-foreground mt-1">{customer?.businessName ?? "—"}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Chat URL</label>
                  <div className="text-sm text-foreground mt-1 font-mono">{chatUrl}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Website</label>
                  <a
                    href={customer?.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-1 block truncate"
                  >
                    {customer?.websiteUrl}
                  </a>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Prepaid until</label>
                  <div className="text-sm text-foreground mt-1">{prepaidUntil?.toLocaleDateString() ?? "—"}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Accent color</label>
                  <div
                    className="w-6 h-6 rounded-full mt-1 border border-border"
                    style={{ backgroundColor: customer?.primaryColor ?? "#000" }}
                  />
                </div>
                {customer && ["content_collection", "crawling", "indexing"].includes(customer.status) && (
                  <button
                    onClick={handleCrawl}
                    disabled={crawling || (credits !== null && credits.remaining < 1)}
                    className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                  >
                    {crawling ? "Crawling..." : contentCount ? "Refresh content" : "Build my chatbot"}
                  </button>
                )}
                {contentCount > 0 && (
                  <Link
                    href={`/chat/c/${customer?.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-muted"
                  >
                    Open full chat →
                  </Link>
                )}
              </div>
            </div>
          )}

          {activePanel === "domains" && (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">DNS Setup</h2>
              <p className="text-sm text-muted-foreground mb-4">Add this CNAME record to your DNS:</p>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                {`Type: CNAME
Host: ${customer?.subdomain ?? "chat"}
Value: cname.forwardslash.chat`}
              </pre>
              <p className="text-xs text-muted-foreground mt-4">
                <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a>
                {" · "}
                <a href="https://www.godaddy.com/help/add-a-cname-record-19236" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a>
              </p>
              {customer?.status === "dns_setup" && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/customers/${customer.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "testing" }),
                    });
                    if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "testing" } } : d));
                  }}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  I&apos;ve added my DNS
                </button>
              )}
              {customer?.status === "testing" && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/customers/${customer.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "delivered" }),
                    });
                    if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "delivered" } } : d));
                  }}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Chatbot is live
                </button>
              )}
            </div>
          )}

          {activePanel === "order" && (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Status</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${order.status === "paid" || order.status === "delivered" ? "bg-green-500" : "bg-amber-500"}`} />
                <span className="text-foreground">{STATUS_LABELS[order.status] ?? order.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                ${(order.amountCents / 100).toLocaleString()} • {order.bundleYears}-year bundle
                {order.dnsHelp ? " • DNS help included" : ""}
              </p>
              <h3 className="font-medium text-foreground mb-3">Checklist</h3>
              <ul className="space-y-2">
                {CHECKLIST.map((item, i) => {
                  const done = [
                    true,
                    true,
                    contentCount > 0,
                    contentCount > 0,
                    ["testing", "delivered"].includes(customer?.status ?? ""),
                    customer?.status === "delivered",
                  ][i];
                  return (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <span className={done ? "text-green-500" : ""}>{done ? "✓" : "○"}</span>
                      {item}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Chat preview - always shown when we have a customer */}
          {customer && (activePanel === "design" || activePanel === "domains" || activePanel === "order") && (
            <div className="flex-1 min-w-[320px] p-4 flex flex-col border-l border-border bg-muted/10">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <CustomerChat
                  customerId={customer.id}
                  businessName={customer.businessName}
                  primaryColor={customer.primaryColor ?? "#000"}
                  compact={false}
                />
              </div>
            </div>
          )}
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
