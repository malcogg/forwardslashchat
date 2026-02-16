"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Globe } from "lucide-react";
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

const ACCENT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#0ea5e9", "#6366f1",
  "#a855f7", "#d946ef", "#1e293b", "#374151", "#4b5563", "#6b7280",
];

function getDisplayName(user: { firstName?: string | null; lastName?: string | null; fullName?: string | null } | null | undefined): string {
  if (!user) return "Michael Francis";
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.fullName) return user.fullName;
  return "Michael Francis";
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function DashboardContent() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const [activePanel, setActivePanel] = useState<"design" | "domains" | "order">("design");
  const [designTab, setDesignTab] = useState<"general" | "about" | "pricing">("general");

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
      .then((res) => !res.ok ? Promise.reject(new Error("Failed")) : res.json())
      .then(setData)
      .catch(() => setError("Could not load dashboard"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetch("/api/orders/me").then((res) => (res.ok ? res.json() : [])).then(setMyOrders).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/credits").then((res) => (res.ok ? res.json() : null)).then(setCredits).catch(() => {});
  }, []);

  const handleCrawl = () => {
    if (!data?.customer?.id) return;
    setCrawling(true);
    fetch(`/api/customers/${data.customer.id}/crawl`, { method: "POST" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Crawl failed");
        const [dashRes, creditsRes] = await Promise.all([
          fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`),
          fetch("/api/credits"),
        ]);
        if (dashRes.ok) setData(await dashRes.json());
        if (creditsRes.ok) setCredits(await creditsRes.json());
      })
      .catch(() => {})
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

  return (
    <main className="min-h-screen bg-background">
      {/* Browser bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-xs text-muted-foreground ml-2">
            <Globe className="w-3 h-3" />
            forwardslash.chat/dashboard
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">Admin</Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

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
              <p className="text-xs font-medium text-muted-foreground mb-1">Your sites</p>
              {myOrders.map(({ order: o, customer: c }) => (
                <Link
                  key={o.id}
                  href={`/dashboard?orderId=${o.id}`}
                  className={`block px-2 py-1 text-sm rounded truncate ${
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
              <a href={customer.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 rounded hover:text-foreground">
                <span>▸</span> View site
              </a>
            )}
            <button onClick={() => setActivePanel("design")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "design" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span>✦</span> Training
            </button>
            <button onClick={() => setActivePanel("design")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "design" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span>◉</span> Design
            </button>
            <button onClick={() => setActivePanel("domains")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "domains" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span>⊕</span> Domains
            </button>
            <button onClick={() => setActivePanel("order")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "order" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span>$</span> Get paid
            </button>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>☰</span> Chat logs
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>☺</span> Users
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <span>⚙</span> Settings
            </div>
          </nav>

          <div className="pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground">Content pages</div>
            <div className="text-sm text-foreground">{hasOrder ? contentCount : "0"} crawled</div>
            {credits && <div className="text-xs text-primary mt-1">{credits.remaining} / {credits.creditsLimit} credits</div>}
            <div className="flex items-center gap-2 mt-4">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-foreground text-xs font-medium">{initials}</span>
              </div>
              <span className="text-sm text-foreground truncate">{displayName}</span>
            </div>
          </div>
        </aside>

        {/* Design panel */}
        <div className="w-64 border-r border-border p-4 overflow-y-auto shrink-0 hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-foreground">Design</h3>
            <div className="flex gap-1">
              <button onClick={() => setDesignTab("general")} className={`px-3 py-1 text-xs rounded ${designTab === "general" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>General</button>
              <button onClick={() => setDesignTab("about")} className={`px-3 py-1 text-xs rounded ${designTab === "about" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>About</button>
              <button onClick={() => setDesignTab("pricing")} className={`px-3 py-1 text-xs rounded ${designTab === "pricing" ? "bg-muted text-foreground" : "text-muted-foreground"}`}>Pricing</button>
            </div>
          </div>

          {designTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Display name</label>
                <div className="text-sm text-foreground mt-1">{customer?.businessName ?? "—"}</div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Logo</label>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mt-1">
                  <span className="text-foreground text-sm font-medium">{(customer?.businessName ?? "?")[0]}</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-primary-foreground text-xs">{initials}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{displayName}</div>
                    <div className="text-xs text-muted-foreground">{customer?.businessName ?? "Chatbot"}</div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Favicon</label>
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center mt-1">
                  <span className="text-primary-foreground text-xs">✦</span>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Accent</label>
                <div className="w-6 h-6 rounded-full mt-1 border border-border" style={{ backgroundColor: customer?.primaryColor ?? "#000" }} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Heading</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ACCENT_COLORS.map((c) => (
                    <div key={c} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {customer && ["content_collection", "crawling", "indexing"].includes(customer.status) && (
                <button onClick={handleCrawl} disabled={crawling || (credits !== null && credits.remaining < 1)} className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
                  {crawling ? "Crawling..." : contentCount ? "Refresh content" : "Build my chatbot"}
                </button>
              )}
              {contentCount > 0 && customer && (
                <Link href={`/chat/c/${customer.id}`} target="_blank" rel="noopener noreferrer" className="block w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-muted">
                  Open full chat →
                </Link>
              )}
            </div>
          )}
          {designTab === "about" && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>About page content for your chatbot.</p>
            </div>
          )}
          {designTab === "pricing" && (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Pricing page content for your chatbot.</p>
            </div>
          )}

          {hasOrder && (
            <div className="flex gap-2 mt-6">
              <button className="px-3 py-1.5 text-sm border border-border rounded text-foreground">Discard</button>
              <button className="px-3 py-1.5 text-sm bg-foreground text-background rounded">Save</button>
            </div>
          )}
        </div>

        {/* Main content: Domains or Order when active */}
        {(activePanel === "domains" || activePanel === "order") && (
          <div className="flex-1 overflow-y-auto p-6 border-r border-border">
            {activePanel === "domains" && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-4">DNS Setup</h2>
                <p className="text-sm text-muted-foreground mb-4">Add this CNAME record to your DNS:</p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                  {`Type: CNAME\nHost: ${customer?.subdomain ?? "chat"}\nValue: cname.forwardslash.chat`}
                </pre>
                <p className="text-xs text-muted-foreground mt-4">
                  <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a>
                  {" · "}
                  <a href="https://www.godaddy.com/help/add-a-cname-record-19236" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a>
                </p>
                {customer?.status === "dns_setup" && (
                  <button onClick={async () => {
                    const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "testing" }) });
                    if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "testing" } } : d));
                  }} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                    I&apos;ve added my DNS
                  </button>
                )}
                {customer?.status === "testing" && (
                  <button onClick={async () => {
                    const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "delivered" }) });
                    if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "delivered" } } : d));
                  }} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Chatbot is live
                  </button>
                )}
              </>
            )}
            {activePanel === "order" && hasOrder && (
              <>
                <h2 className="text-lg font-semibold text-foreground mb-4">Order Status</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2 h-2 rounded-full ${order.status === "paid" || order.status === "delivered" ? "bg-green-500" : "bg-amber-500"}`} />
                  <span>{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  ${(order.amountCents / 100).toLocaleString()} • {order.bundleYears}-year bundle {order.dnsHelp ? "• DNS help" : ""}
                </p>
                <h3 className="font-medium text-foreground mb-3">Checklist</h3>
                <ul className="space-y-2">
                  {CHECKLIST.map((item, i) => {
                    const done = [true, true, contentCount > 0, contentCount > 0, ["testing", "delivered"].includes(customer?.status ?? ""), customer?.status === "delivered"][i];
                    return <li key={i} className="flex items-center gap-2 text-muted-foreground"><span className={done ? "text-green-500" : ""}>{done ? "✓" : "○"}</span>{item}</li>;
                  })}
                </ul>
              </>
            )}
            {activePanel === "order" && !hasOrder && (
              <p className="text-muted-foreground">
                Complete a checkout to see your order. <Link href="/checkout" className="text-primary hover:underline">Go to checkout</Link>
              </p>
            )}
          </div>
        )}

        {/* Chat preview */}
        <div className="flex-1 min-w-[320px] p-4 flex flex-col bg-muted/10">
          {customer ? (
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
              <CustomerChat customerId={customer.id} businessName={customer.businessName} primaryColor={customer.primaryColor ?? "#000"} compact={false} />
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border shadow-sm flex-1 flex flex-col items-center justify-center p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"><span className="text-foreground text-xs">MF</span></div>
                <span className="text-sm font-medium text-foreground">Your chatbot</span>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Complete checkout to preview your chatbot.
              </p>
              <Link href="/checkout" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
                Go to checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Loading...</p></main>}>
      <DashboardContent />
    </Suspense>
  );
}
