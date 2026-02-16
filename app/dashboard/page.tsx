"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { Globe, Check, ChevronDown, X, Monitor, Tablet, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerChat } from "@/components/CustomerChat";

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

  const [activePanel, setActivePanel] = useState<"design" | "domains">("design");
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [dnsModalOpen, setDnsModalOpen] = useState(false);
  const [previewView, setPreviewView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const scanDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scanDropdownOpen) return;
    const h = (e: MouseEvent) => {
      if (scanDropdownRef.current && !scanDropdownRef.current.contains(e.target as Node)) setScanDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [scanDropdownOpen]);

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
    let mounted = true;
    const load = (retries = 2) => {
      fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, { credentials: "include", cache: "no-store" })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json();
            if (mounted) setData(json);
            if (mounted) setLoading(false);
            return;
          }
          const err = await res.json().catch(() => ({}));
          // Retry on 401 (session may not be ready yet after sign-up redirect)
          if (res.status === 401 && retries > 0) {
            setTimeout(() => load(retries - 1), 800);
            return;
          }
          if (mounted) setError((err as { error?: string }).error ?? "Could not load dashboard");
          if (mounted) setLoading(false);
        })
        .catch(() => {
          if (mounted) setError("Could not load dashboard");
          if (mounted) setLoading(false);
        });
    };
    setLoading(true);
    setError(null);
    load();
    return () => { mounted = false; };
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
      <main className="min-h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
          <span className="text-xs text-muted-foreground">forwardslash.chat</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  if (error || (orderId && !data?.order)) {
    return (
      <main className="min-h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
          <span className="text-xs text-muted-foreground">forwardslash.chat</span>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Home</Link>
            <ThemeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">{error ?? "Order not found"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, { credentials: "include", cache: "no-store" })
                  .then(async (res) => {
                    const json = await res.json();
                    if (res.ok) {
                      setData(json);
                    } else {
                      setError((json as { error?: string }).error ?? "Could not load dashboard");
                    }
                  })
                  .catch(() => setError("Could not load dashboard"))
                  .finally(() => setLoading(false));
              }}
              className="text-sm px-4 py-2 border border-border rounded hover:bg-muted"
            >
              Retry
            </button>
            <Link href="/" className="text-sm px-4 py-2 text-primary hover:underline">
              Back to home
            </Link>
          </div>
        </div>
        </div>
      </main>
    );
  }

  const order = data?.order;
  const customer = data?.customer;
  const hasOrder = !!order;
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
          <ThemeToggle />
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

          <div className="relative mb-4" ref={scanDropdownRef}>
            <button
              onClick={() => setScanDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 rounded hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <span>▸</span> Scan site
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${scanDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {scanDropdownOpen && (
              <div className="absolute left-full top-0 ml-2 py-1 min-w-[200px] bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {myOrders.length === 0 ? (
                  <Link href="/" onClick={() => setScanDropdownOpen(false)} className="block px-3 py-2 text-sm text-foreground hover:bg-accent">
                    Scan new site
                  </Link>
                ) : (
                  <>
                    {myOrders.map(({ order: o, customer: c }) => (
                      <Link
                        key={o.id}
                        href={`/dashboard?orderId=${o.id}`}
                        onClick={() => setScanDropdownOpen(false)}
                        className={`block px-3 py-2 text-sm truncate ${
                          orderId === o.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {c?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? c?.businessName ?? "Order"}
                      </Link>
                    ))}
                    <Link href="/" onClick={() => setScanDropdownOpen(false)} className="block px-3 py-2 text-sm text-primary hover:bg-accent border-t border-border mt-1 pt-2">
                      + Scan new site
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <nav className="space-y-0.5 flex-1">
            <button onClick={() => setActivePanel("design")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "design" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span className="w-5 shrink-0">{contentCount > 0 ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground/50">○</span>}</span>
              Training
            </button>
            <button onClick={() => setActivePanel("design")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "design" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span className="w-5 shrink-0">{customer && contentCount > 0 ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground/50">○</span>}</span>
              Design
            </button>
            <button onClick={() => setActivePanel("domains")} className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left ${activePanel === "domains" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <span className="w-5 shrink-0">{[ "testing", "delivered" ].includes(customer?.status ?? "") ? <Check className="w-4 h-4 text-green-500" /> : <span className="text-muted-foreground/50">○</span>}</span>
              Domains
            </button>
            <button onClick={() => setDnsModalOpen(true)} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 rounded hover:text-foreground text-left">
              <span className="w-5 shrink-0">○</span>
              DNS
            </button>
          </nav>

          {/* CTA / Upsell - below DNS, in sidebar */}
          <button
            onClick={() => setUpsellModalOpen(true)}
            className="w-full mt-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border text-left hover:shadow-md transition-shadow"
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Also from us</p>
            <p className="text-xs font-semibold text-foreground mt-0.5">Web design & marketing</p>
            <p className="text-[10px] text-muted-foreground mt-1">Full overhauls for local businesses →</p>
          </button>

          <div className="pt-6 border-t border-border mt-4">
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

        {/* Center panel: Design | Domains */}
        <div className={`border-r border-border overflow-y-auto shrink-0 ${activePanel === "design" ? "w-64 p-4" : "min-w-[280px] flex-1 max-w-md p-6"}`}>
          {activePanel === "design" && (
            <>
              <h3 className="font-medium text-foreground mb-6">Design</h3>

              {!hasOrder ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Welcome, {displayName}. Get your AI chatbot by completing checkout.
                  </p>
                  <Link href="/" className="block w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-muted">
                    Scan your site
                  </Link>
                  <Link href="/checkout" className="block w-full px-3 py-2 text-sm text-center bg-primary text-primary-foreground rounded hover:opacity-90">
                    Get started →
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    One payment. Your domain. Hosting included.
                  </p>
                </div>
              ) : (
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
                </div>
              )}

              {hasOrder && (
                <div className="flex gap-2 mt-6">
                  <button className="px-3 py-1.5 text-sm border border-border rounded text-foreground">Discard</button>
                  <button className="px-3 py-1.5 text-sm bg-foreground text-background rounded">Save</button>
                </div>
              )}
            </>
          )}

          {activePanel === "domains" && (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-4">DNS Setup</h2>
              {customer ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Add this CNAME record to your DNS:</p>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                    {`Type: CNAME\nHost: ${customer.subdomain}\nValue: cname.forwardslash.chat`}
                  </pre>
                  <p className="text-xs text-muted-foreground mt-4">
                    <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a>
                    {" · "}
                    <a href="https://www.godaddy.com/help/add-a-cname-record-19236" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a>
                  </p>
                  {customer.status === "dns_setup" && (
                    <button onClick={async () => {
                      const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "testing" }) });
                      if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "testing" } } : d));
                    }} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                      I&apos;ve added my DNS
                    </button>
                  )}
                  {customer.status === "testing" && (
                    <button onClick={async () => {
                      const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "delivered" }) });
                      if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "delivered" } } : d));
                    }} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Chatbot is live
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete checkout to set up your domain. <Link href="/checkout" className="text-primary hover:underline">Go to checkout</Link>
                </p>
              )}
            </>
          )}

        </div>

        {/* Chat preview */}
        <div className="flex-1 min-w-[320px] p-4 flex flex-col bg-muted/10">
          {customer ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* Device view toggle + preview frame */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Live preview</span>
                <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50 border border-border">
                  <button
                    onClick={() => setPreviewView("desktop")}
                    className={`p-1.5 rounded-md transition-colors ${previewView === "desktop" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Desktop view"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewView("tablet")}
                    className={`p-1.5 rounded-md transition-colors ${previewView === "tablet" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Tablet view"
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewView("mobile")}
                    className={`p-1.5 rounded-md transition-colors ${previewView === "mobile" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Mobile view"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div
                className={`flex-1 flex justify-center min-h-0 transition-[max-width] duration-200 ${
                  previewView === "desktop" ? "max-w-full" : previewView === "tablet" ? "max-w-[480px] mx-auto" : "max-w-[320px] mx-auto"
                }`}
              >
                <div
                  className={`w-full h-full bg-card border border-border shadow-lg overflow-hidden flex flex-col min-h-0 ring-1 ring-black/5 transition-all duration-200 ${
                    previewView === "desktop" ? "rounded-xl" : previewView === "tablet" ? "rounded-2xl" : "rounded-[2rem]"
                  }`}
                >
                  <CustomerChat customerId={customer.id} businessName={customer.businessName} primaryColor={customer.primaryColor ?? "#000"} compact={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border shadow-sm flex-1 flex flex-col items-center justify-center p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><span className="text-primary-foreground text-sm font-medium">{initials}</span></div>
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

      {/* Upsell modal */}
      {upsellModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setUpsellModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-white rounded-2xl shadow-2xl p-8 text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setUpsellModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4">Turn old dumb websites into smart ones</h3>
            <p className="text-gray-600 mb-6">
              Let us full overhaul your brand and we&apos;ll bring in real local customers.
            </p>
            <p className="text-sm font-medium text-gray-700 mb-2">1-on-1 Strategy Call with the founder</p>
            <a
              href={process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 text-center font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Book a call
            </a>
          </div>
        </div>
      )}

      {/* DNS modal */}
      {dnsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDnsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-white rounded-2xl shadow-2xl p-8 text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDnsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold mb-4">DNS Setup</h3>
            <p className="text-gray-600 mb-4">
              To put your chatbot live at your domain, add a CNAME record in your DNS provider:
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
              {`Type: CNAME
Host: ${customer?.subdomain ?? "chat"}
Value: cname.forwardslash.chat`}
            </pre>
            <p className="text-sm text-gray-600 mb-6">
              Need help? We can do it for you—just book a quick call.
            </p>
            <a
              href={process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min"}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 text-center font-semibold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Let us help with DNS
            </a>
          </div>
        </div>
      )}
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
