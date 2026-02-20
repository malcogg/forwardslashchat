"use client";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PENDING_SCAN_URL_KEY } from "@/components/ScanModal";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { Globe, Check, ChevronDown, X, Monitor, Tablet, Smartphone, Copy, ExternalLink, Trash2, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerChat } from "@/components/CustomerChat";
import { ScanModal } from "@/components/ScanModal";
import { getPriceFromPagesAndYears } from "@/lib/pricing";

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
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const displayName = getDisplayName(user);

  // Call dashboard/orders only when we have a signed-in user (avoids 401 after redirect).
  // Dashboard is for all signed-in users; payment is only required to run "Build my chatbot".
  const canCallApi = clerkLoaded && !!user;

  // Auth header so API routes get the session even when cookies aren't sent (e.g. after Google redirect).
  const authHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // If Clerk loaded and still no user after a short wait (signed out / session expired), show sign-in.
  useEffect(() => {
    if (!clerkLoaded || user) return;
    const t = setTimeout(() => {
      setLoading(false);
      setError("Sign in required");
    }, 2000);
    return () => clearTimeout(t);
  }, [clerkLoaded, user]);

  // Spec: After signup, user arrives with pending scan URL. Create project and redirect.
  useEffect(() => {
    if (!canCallApi || orderId) return;
    try {
      const raw = sessionStorage.getItem(PENDING_SCAN_URL_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_SCAN_URL_KEY);
      let pendingUrl: string;
      let pendingEstimatedPages: number | undefined;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.url === "string") {
          pendingUrl = parsed.url;
          pendingEstimatedPages = typeof parsed.estimatedPages === "number" ? parsed.estimatedPages : undefined;
        } else {
          pendingUrl = raw;
        }
      } catch {
        pendingUrl = raw;
      }
      (async () => {
        const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
        const res = await fetch("/api/scan-request", {
          method: "POST",
          headers,
          body: JSON.stringify({ url: pendingUrl, estimatedPages: pendingEstimatedPages }),
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed");
        if (json.orderId) router.replace(`/dashboard?orderId=${encodeURIComponent(json.orderId)}`);
      })().catch(() => {
        sessionStorage.setItem(PENDING_SCAN_URL_KEY, raw);
      });
    } catch {
      /* ignore */
    }
  }, [orderId, router, canCallApi]);
  const initials = getInitials(displayName);

  const [activePanel, setActivePanel] = useState<"design" | "domains">("design");
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);
  const [scanNewSiteModalOpen, setScanNewSiteModalOpen] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
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
      lastCrawledAt: string | null;
      status: string;
      primaryColor: string | null;
    } | null;
    contentCount?: number;
  } | null>(null);
  const [myOrders, setMyOrders] = useState<{
    order: { id: string; status?: string };
    customer: { businessName: string; websiteUrl: string } | null;
    contentCount: number;
    estimatedPages: number;
  }[]>([]);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartSelectedIds, setCartSelectedIds] = useState<Set<string>>(new Set());
  type NotificationItem = { id: string; title: string; body: string; read: boolean };
  const [notificationReadIds, setNotificationReadIds] = useState<Set<string>>(() => new Set());

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ONBOARDING_SEEN_KEY = "forwardslash_onboarding_seen";
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Wait for signed-in user; send Bearer token so API has session (fixes 401 when cookie not sent after redirect)
  useEffect(() => {
    if (!canCallApi) return;
    let mounted = true;
    const load = async (retries = 2) => {
      const headers = await authHeaders();
      const res = await fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, {
        credentials: "include",
        cache: "no-store",
        headers: { ...headers },
      });
      if (!mounted) return;
      if (res.ok) {
        const json = await res.json();
        if (mounted) setData(json);
        if (mounted) setLoading(false);
        return;
      }
      const err = await res.json().catch(() => ({}));
      if (res.status === 401 && retries > 0) {
        setTimeout(() => load(retries - 1), 1200);
        return;
      }
      if (res.status === 401) {
        if (mounted) setError("Sign in required");
        if (mounted) setLoading(false);
        return;
      }
      if (mounted) setError((err as { error?: string }).error ?? "Could not load dashboard");
      if (mounted) setLoading(false);
    };
    const doLoad = () => load().catch(() => {
      if (mounted) setError("Could not load dashboard");
      if (mounted) setLoading(false);
    });
    setLoading(true);
    setError(null);
    const t = setTimeout(() => { if (mounted) doLoad(); }, 400);
    return () => { clearTimeout(t); mounted = false; };
  }, [orderId, canCallApi]);

  useEffect(() => {
    if (!canCallApi) return;
    let mounted = true;
    const loadOrders = async (retries = 1) => {
      const headers = await authHeaders();
      const res = await fetch("/api/orders/me", { credentials: "include", headers: { ...headers } });
      if (!mounted) return;
      if (res.ok) {
        const json = await res.json();
        if (mounted) setMyOrders(json);
        return;
      }
      if (res.status === 401 && retries > 0) {
        setTimeout(() => loadOrders(retries - 1), 1200);
      }
    };
    const t = setTimeout(() => { loadOrders().catch(() => {}); }, 600);
    return () => { clearTimeout(t); mounted = false; };
  }, [canCallApi]);

  // Poll when current order is pending so user sees status = 'paid' soon after you set it in Neon
  useEffect(() => {
    const isPending = data?.order?.status && data.order.status !== "paid";
    if (!isPending) return;
    const currentOrderId = orderId ?? data?.order?.id;
    const interval = setInterval(async () => {
      const headers = await authHeaders();
      const url = currentOrderId
        ? `/api/dashboard?orderId=${encodeURIComponent(currentOrderId)}`
        : "/api/dashboard";
      const res = await fetch(url, { credentials: "include", cache: "no-store", headers: { ...headers } });
      const json = res.ok ? await res.json() : null;
      if (json?.order?.status === "paid") {
        setData(json);
        const h = await authHeaders();
        const r = await fetch("/api/orders/me", { credentials: "include", headers: { ...h } });
        if (r.ok) setMyOrders(await r.json());
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [orderId, data?.order?.status, data?.order?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !canCallApi || loading || error) return;
    try {
      if (!window.localStorage.getItem(ONBOARDING_SEEN_KEY)) setShowOnboardingModal(true);
    } catch {
      /* ignore */
    }
  }, [canCallApi, loading, error]);

  const handleDeleteSite = async (orderIdToDelete: string) => {
    if (deletingOrderId) return;
    setDeletingOrderId(orderIdToDelete);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/orders/${orderIdToDelete}`, { method: "DELETE", credentials: "include", headers: { ...headers } });
      if (res.ok) {
        setCartSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(orderIdToDelete);
          return next;
        });
        setMyOrders((prev) => prev.filter((o) => o.order.id !== orderIdToDelete));
        if (orderId === orderIdToDelete && myOrders.length > 1) {
          const remaining = myOrders.find((o) => o.order.id !== orderIdToDelete);
          if (remaining) router.push(`/dashboard?orderId=${remaining.order.id}`);
        } else if (orderId === orderIdToDelete) {
          router.push("/dashboard");
        }
      }
    } finally {
      setDeletingOrderId(null);
    }
  };

  const openCartModal = () => {
    if (myOrders.length > 0 && cartSelectedIds.size === 0) {
      setCartSelectedIds(new Set(myOrders.map((o) => o.order.id)));
    }
    setCartModalOpen(true);
  };

  const handleCrawl = async () => {
    if (!data?.customer?.id) return;
    if (data.order?.status !== "paid") {
      router.push(
        `/checkout?plan=chatbot-2y&pages=25&url=${encodeURIComponent(data.customer?.websiteUrl ?? "")}&orderId=${encodeURIComponent(data.order?.id ?? "")}`
      );
      return;
    }
    setCrawlError(null);
    setCrawling(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/customers/${data.customer.id}/crawl`, { method: "POST", credentials: "include", headers: { ...headers } });
      const json = await res.json();
      if (!res.ok) {
        setCrawlError(json.error ?? "Crawl failed");
        return;
      }
      const h = await authHeaders();
      const [dashRes, ordersRes] = await Promise.all([
        fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, { credentials: "include", headers: { ...h } }),
        fetch("/api/orders/me", { credentials: "include", headers: { ...h } }),
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (ordersRes.ok) setMyOrders(await ordersRes.json());
    } catch {
      setCrawlError("Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  const copyCname = () => {
    const cname = `Type: CNAME\nHost: ${customer?.subdomain ?? "chat"}\nValue: cname.forwardslash.chat`;
    navigator.clipboard.writeText(cname).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Derive values and notifications before any early return so hook count is stable (React #310)
  const order = data?.order;
  const customer = data?.customer;
  const hasOrder = !!order;
  const contentCount = data?.contentCount ?? 0;
  const hasPaidOrder = myOrders.some((o) => o.order.status === "paid");
  const isPaid = order?.status === "paid";
  const customerStatus = customer?.status ?? "";
  const isLive = customerStatus === "delivered";
  const isTestingOrLive = ["testing", "delivered"].includes(customerStatus);

  const notifications = useMemo(() => {
    type Config = { id: string; title: string; body: string };
    const configs: Config[] = [];
    configs.push({
      id: "welcome",
      title: "Welcome to ForwardSlash",
      body: "Your dashboard is where you'll manage your AI chatbot: add your site, train it on your content, and connect your domain. Need help? Reply to any email from us or use the support link in the footer.",
    });
    if (myOrders.length >= 1 && !hasPaidOrder) {
      configs.push({ id: "site_added", title: "You added a site", body: "Complete checkout to unlock your AI chatbot. We'll train it on your content and deploy it at chat.yourdomain.com." });
    }
    if (isPaid && contentCount === 0) {
      configs.push({ id: "payment_confirmed", title: "Payment confirmed", body: "We're building your chatbot. Click \"Build my chatbot\" in the Training section to crawl your site and train the AI on your content." });
    }
    if (isPaid && contentCount > 0 && !isTestingOrLive) {
      configs.push({ id: "crawl_done", title: "Content ready", body: `We've crawled ${contentCount} pages. Your chatbot is being trained on your content. Next: we'll email you when it's time to add your domain (e.g. chat.yoursite.com).` });
    }
    if (isPaid && contentCount > 0 && isTestingOrLive && !isLive) {
      configs.push({ id: "domain_next", title: "Add your domain", body: "Your chatbot is ready for testing. Add the CNAME record we sent you (e.g. chat.yoursite.com) to go live." });
    }
    if (isLive) {
      configs.push({ id: "go_live", title: "Your chatbot is live", body: "Your AI chatbot is live at your domain. Share the link with customers and we'll keep it updated." });
    }
    return configs.map((c) => ({ id: c.id, title: c.title, body: c.body, read: notificationReadIds.has(c.id) }));
  }, [myOrders.length, hasPaidOrder, isPaid, contentCount, isTestingOrLive, isLive, notificationReadIds]);

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
        <div className="flex h-[calc(100vh-52px)]">
          <aside className="w-56 border-r border-border bg-muted/20 p-4 animate-pulse">
            <div className="h-8 w-8 rounded-lg bg-muted mb-6" />
            <div className="h-4 w-32 bg-muted rounded mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 bg-muted rounded" />
              ))}
            </div>
          </aside>
          <div className="flex-1 p-6 space-y-6">
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              {error === "Sign in required" && (
                <Link
                  href="/sign-in"
                  className="text-sm px-4 py-2 rounded bg-primary text-primary-foreground hover:opacity-90"
                >
                  Sign in again
                </Link>
              )}
              <button
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    const headers = await authHeaders();
                    const res = await fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, {
                      credentials: "include",
                      cache: "no-store",
                      headers: { ...headers },
                    });
                    const json = await res.json();
                    if (res.ok) setData(json);
                    else setError((json as { error?: string }).error ?? "Could not load dashboard");
                  } catch {
                    setError("Could not load dashboard");
                  } finally {
                    setLoading(false);
                  }
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

  const RESCAN_DAYS = 7;
  const lastCrawled = customer?.lastCrawledAt ? new Date(customer.lastCrawledAt) : null;
  const nextCrawlAvailable = lastCrawled
    ? new Date(lastCrawled.getTime() + RESCAN_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const canRescan = !lastCrawled || !nextCrawlAvailable || new Date() >= nextCrawlAvailable;

  const STATUS_STEPS = [
    { key: "payment", label: "Payment confirmed", done: ["paid", "processing", "delivered"].includes(order?.status ?? "") },
    { key: "content", label: "Content & training", done: (contentCount ?? 0) > 0 || ["dns_setup", "testing", "delivered"].includes(customer?.status ?? "") },
    { key: "dns", label: "DNS setup", done: ["testing", "delivered"].includes(customer?.status ?? "") },
    { key: "live", label: "Chatbot live", done: customer?.status === "delivered" },
  ];

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
          {myOrders.some((o) => o.order.status === "paid") && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">PRO</span>
          )}
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationOpen((o) => !o)}
              className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>
            {notificationOpen && (
              <>
                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setNotificationOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-background shadow-xl z-50 py-1">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Notifications</p>
                {notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedNotification(n);
                        setNotificationOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 flex flex-col gap-0.5 ${!n.read ? "bg-muted/30" : ""}`}
                    >
                      <span className="font-medium text-foreground">{n.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>
                    </button>
                  ))
                )}
                </div>
              </>
            )}
          </div>
          <div className="relative inline-block">
            <UserButton afterSignOutUrl="/" />
            {myOrders.some((o) => o.order.status === "paid") && (
              <span
                className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-emerald-500 text-white"
                title="Verified customer"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
              </span>
            )}
          </div>
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

          <div className="mb-2" ref={scanDropdownRef}>
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
              <div className="mt-1 py-2 px-2 space-y-0.5 border-l-2 border-muted ml-2 pl-3">
                {myOrders.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScanDropdownOpen(false);
                      setScanNewSiteModalOpen(true);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded"
                  >
                    Scan new site
                  </button>
                ) : (
                  <>
                    {myOrders.map(({ order: o, customer: c, estimatedPages: ep }) => (
                      <div
                        key={o.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded group ${
                          orderId === o.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <Link
                          href={`/dashboard?orderId=${o.id}`}
                          onClick={() => setScanDropdownOpen(false)}
                          className="flex-1 min-w-0 truncate text-sm"
                        >
                          {c?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? c?.businessName ?? "Order"}
                        </Link>
                        <span className="text-xs text-muted-foreground shrink-0">~{ep} pg</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteSite(o.id);
                          }}
                          disabled={deletingOrderId === o.id}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          aria-label="Delete site"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setScanDropdownOpen(false);
                        setScanNewSiteModalOpen(true);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-primary hover:bg-accent rounded mt-1 pt-2 border-t border-border"
                    >
                      + Scan new site
                    </button>
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
              Domain
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
            {(() => {
              const hasPaidOrder = myOrders.some((o) => o.order.status === "paid");
              const totalPages = myOrders.reduce((s, o) => s + (o.estimatedPages ?? 25), 0);
              const totalCrawled = myOrders.reduce((s, o) => s + (o.contentCount ?? 0), 0);
              const selectedPages = myOrders
                .filter((o) => cartSelectedIds.has(o.order.id))
                .reduce((s, o) => s + (o.estimatedPages ?? 25), 0);
              const cartPrice = getPriceFromPagesAndYears(selectedPages, 2);
              const hasSites = myOrders.length > 0;
              return (
                <>
                  <div className="text-xs text-muted-foreground">Content pages</div>
                  <div className="text-sm font-medium text-red-500 dark:text-red-400">
                    {totalCrawled} / {totalPages > 0 ? totalPages : "—"} crawled
                  </div>
                  {hasSites && !hasPaidOrder && (
                    <motion.button
                      type="button"
                      onClick={openCartModal}
                      className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                        boxShadow: "0 0 24px rgba(16,185,129,0.4)",
                      }}
                      animate={{
                        boxShadow: [
                          "0 0 24px rgba(16,185,129,0.4)",
                          "0 0 40px rgba(16,185,129,0.6)",
                          "0 0 24px rgba(16,185,129,0.4)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <span>Get AI chatbot for all — ${cartPrice?.toLocaleString() ?? "—"}</span>
                    </motion.button>
                  )}
                </>
              );
            })()}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
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
              {hasOrder && !isPaid && contentCount > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm font-medium text-foreground mb-1">Scraping complete! We have {contentCount} pages of data ready.</p>
                  <p className="text-sm text-muted-foreground mb-3">Payment unlocks full training of your custom AI chatbot. We use your scraped data to fine-tune and deploy a ready-to-use chatbot at chat.yourdomain.com.</p>
                  <Link
                    href={`/checkout?plan=chatbot-2y&pages=25&url=${encodeURIComponent(customer?.websiteUrl ?? "")}&orderId=${encodeURIComponent(order?.id ?? "")}`}
                    className="inline-block px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-opacity"
                  >
                    Pay to unlock training →
                  </Link>
                </div>
              )}
              {hasOrder && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase">Status</h4>
                  <div className="space-y-1">
                    {STATUS_STEPS.map((s) => (
                      <div key={s.key} className="flex items-center gap-2 text-sm">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${s.done ? "bg-emerald-600 text-white" : "border border-muted-foreground/50"}`}>
                          {s.done ? <Check className="w-2.5 h-2.5" /> : null}
                        </span>
                        <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="font-medium text-foreground mb-6">Design</h3>

              {!hasOrder ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Welcome, {displayName}. Get your AI chatbot by completing checkout.
                  </p>
                  <Link href="/" className="block w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-muted">
                    Scan your site
                  </Link>
                  <Link href="/checkout?plan=chatbot-2y&pages=25" className="block w-full px-3 py-2 text-sm text-center bg-primary text-primary-foreground rounded hover:opacity-90">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Logo</label>
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mt-1">
                        <span className="text-foreground text-sm font-medium">{(customer?.businessName ?? "?")[0]}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Favicon</label>
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mt-1">
                        <span className="text-primary-foreground text-xs">✦</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0" style={{ backgroundColor: customer?.primaryColor ?? "#000" }}>
                        <span className="text-white text-xs">{initials}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{customer?.businessName ?? "Chatbot"}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">Accent</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        defaultValue={customer?.primaryColor ?? "#000000"}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5"
                      />
                      <span className="text-xs text-muted-foreground">Pick your brand color</span>
                    </div>
                  </div>
                  {customer && (["content_collection", "crawling", "indexing"].includes(customer.status) || (contentCount > 0 && ["dns_setup", "testing", "delivered"].includes(customer.status))) && (
                    <div className="space-y-2">
                      {lastCrawled && (
                        <p className="text-xs text-muted-foreground">
                          Last scanned: {lastCrawled.toLocaleDateString()}
                          {isPaid && !canRescan && nextCrawlAvailable && (
                            <span className="block">Rescan in {Math.ceil((nextCrawlAvailable.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days</span>
                          )}
                        </p>
                      )}
                      <button
                        onClick={handleCrawl}
                        disabled={crawling || (isPaid && !canRescan && contentCount > 0)}
                        className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                      >
                        {crawling ? "Crawling..." : !isPaid ? "Pay to scan" : contentCount ? (canRescan ? "Rescan site" : "Rescan (7-day cooldown)") : "Build my chatbot"}
                      </button>
                      {crawlError && <p className="text-xs text-destructive">{crawlError}</p>}
                    </div>
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
              <h2 className="text-lg font-semibold text-foreground mb-4">Domain</h2>
              {customer ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Add this CNAME record to your DNS:</p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border pr-12">
                      {`Type: CNAME\nHost: ${customer.subdomain}\nValue: cname.forwardslash.chat`}
                    </pre>
                    <button
                      onClick={copyCname}
                      className="absolute top-3 right-3 p-2 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudflare</a>
                    {" · "}
                    <a href="https://www.godaddy.com/help/add-a-cname-record-19236" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GoDaddy</a>
                  </p>
                  {customer.status === "dns_setup" && (
                    <button onClick={async () => {
                      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
                      const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers, body: JSON.stringify({ status: "testing" }), credentials: "include" });
                      if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "testing" } } : d));
                    }} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                      I&apos;ve added my DNS
                    </button>
                  )}
                  {customer.status === "testing" && (
                    <button onClick={async () => {
                      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
                      const res = await fetch(`/api/customers/${customer.id}`, { method: "PATCH", headers, body: JSON.stringify({ status: "delivered" }), credentials: "include" });
                      if (res.ok) setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, status: "delivered" } } : d));
                    }} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Chatbot is live
                    </button>
                  )}
                  {customer.status === "delivered" && (
                    <a
                      href={`https://${customer.subdomain}.${customer.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Test your chatbot
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete checkout to set up your domain. <Link href="/checkout?plan=chatbot-2y&pages=25" className="text-primary hover:underline">Go to checkout</Link>
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
              <Link href="/checkout?plan=chatbot-2y&pages=25" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
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

      {/* Scan new site modal - same roast flow as homepage, stays in dashboard */}
      <ScanModal
        open={scanNewSiteModalOpen}
        onClose={() => setScanNewSiteModalOpen(false)}
        url=""
        origin="dashboard"
        onAddToDashboard={async (urlToAdd, estimatedPages) => {
          try {
            const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
            const res = await fetch("/api/scan-request", {
              method: "POST",
              headers,
              body: JSON.stringify({ url: urlToAdd, estimatedPages }),
              credentials: "include",
            });
            const json = await res.json();
            if (res.ok && json.orderId) {
              router.replace(`/dashboard?orderId=${encodeURIComponent(json.orderId)}`);
            }
          } catch {
            /* ignore */
          }
        }}
      />

      {/* Cart modal: sites with checkboxes, price, checkout */}
      {cartModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
          onClick={() => setCartModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Your sites</h3>
                <button
                  onClick={() => setCartModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Uncheck sites to remove from your bundle. Price updates below.
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {myOrders.map(({ order, customer, contentCount, estimatedPages }) => {
                const checked = cartSelectedIds.has(order.id);
                const displayUrl = customer?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "Site";
                return (
                  <label
                    key={order.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked ? "border-emerald-500/50 bg-emerald-500/5" : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setCartSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(order.id);
                          else next.delete(order.id);
                          return next;
                        });
                      }}
                      className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{displayUrl}</div>
                      <div className="text-xs text-muted-foreground">
                        ~{estimatedPages} pages
                        {contentCount > 0 && (
                          <span className="text-emerald-600 ml-1">• {contentCount} crawled</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {(() => {
              const selected = myOrders.filter((o) => cartSelectedIds.has(o.order.id));
              const totalPages = selected.reduce((s, o) => s + (o.estimatedPages ?? 25), 0);
              const price = getPriceFromPagesAndYears(totalPages, 2);
              return (
                <div className="p-6 border-t border-border bg-muted/20">
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">
                      {selected.length} site{selected.length !== 1 ? "s" : ""} • ~{totalPages} pages
                    </span>
                    <span className="font-semibold text-foreground">
                      ${price?.toLocaleString() ?? "Contact us"} one-time
                    </span>
                  </div>
                  <Link
                    href={`/checkout?plan=chatbot-2y&pages=${totalPages || 25}`}
                    onClick={() => setCartModalOpen(false)}
                    className="block w-full"
                  >
                    <motion.button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
                        boxShadow: "0 0 24px rgba(16,185,129,0.4)",
                      }}
                      animate={{
                        boxShadow: [
                          "0 0 24px rgba(16,185,129,0.4)",
                          "0 0 40px rgba(16,185,129,0.6)",
                          "0 0 24px rgba(16,185,129,0.4)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Get AI chatbot for all — ${price?.toLocaleString() ?? "—"}
                    </motion.button>
                  </Link>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* First-time welcome onboarding modal: blur background, center, step-through */}
      {showOnboardingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            try { localStorage.setItem(ONBOARDING_SEEN_KEY, "1"); } catch {}
            setShowOnboardingModal(false);
            setOnboardingStep(0);
          }}
        >
          <div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                try { localStorage.setItem(ONBOARDING_SEEN_KEY, "1"); } catch {}
                setShowOnboardingModal(false);
                setOnboardingStep(0);
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Skip"
            >
              <X className="w-5 h-5" />
            </button>
            {onboardingStep === 0 && (
              <>
                <h3 className="font-serif text-xl font-semibold text-foreground pr-8">Thanks for signing up!</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Welcome to ForwardSlash. Here&apos;s how to get your AI chatbot live in a few steps.
                </p>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Next
                </button>
              </>
            )}
            {onboardingStep === 1 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 1</p>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">Add your site</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Use &quot;Scan site&quot; in the sidebar to add your website. We&apos;ll add it here so you can train your chatbot on your content.
                </p>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Next
                </button>
              </>
            )}
            {onboardingStep === 2 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 2</p>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">Checkout</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Pay once to unlock your AI chatbot. No monthly fees — hosting included. Then come back here to continue.
                </p>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(3)}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Next
                </button>
              </>
            )}
            {onboardingStep === 3 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 3</p>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">We train your AI</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Click &quot;Build my chatbot&quot; and we&apos;ll crawl your site and train the AI on your content. You can preview the chat here.
                </p>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(4)}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Next
                </button>
              </>
            )}
            {onboardingStep === 4 && (
              <>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Step 4</p>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">Go live</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  When we email you, add your domain (e.g. chat.yoursite.com) with the CNAME we send. Your chatbot goes live — no monthly fees.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.setItem(ONBOARDING_SEEN_KEY, "1"); } catch {}
                    setShowOnboardingModal(false);
                    setOnboardingStep(0);
                  }}
                  className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Get started
                </button>
              </>
            )}
            <div className="flex justify-center gap-1.5 mt-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === onboardingStep ? "bg-emerald-600" : "bg-muted-foreground/30"}`}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notification detail modal: blur background, center */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => {
            if (selectedNotification) setNotificationReadIds((prev) => new Set(prev).add(selectedNotification.id));
            setSelectedNotification(null);
          }}
        >
          <div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{selectedNotification.title}</h3>
              <button
                type="button"
                onClick={() => {
                  if (selectedNotification) setNotificationReadIds((prev) => new Set(prev).add(selectedNotification.id));
                  setSelectedNotification(null);
                }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {selectedNotification.body}
            </p>
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
