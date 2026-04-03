"use client";

import { useState, useEffect, Suspense, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PENDING_SCAN_URL_KEY } from "@/components/ScanModal";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import {
  Globe,
  Check,
  ChevronDown,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  ExternalLink,
  Trash2,
  Bell,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Layers,
  Globe2,
  Sparkles,
  PackageCheck,
  GraduationCap,
  Palette,
  Link2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CustomerChat } from "@/components/CustomerChat";
import { ScanModal } from "@/components/ScanModal";
import { DashboardMobileSheet, type MobileSheetPanel } from "@/components/DashboardMobileSheet";
import { getPriceFromPagesAndYears } from "@/lib/pricing";
import type { MobileScreen } from "@/components/dashboard/mobile-types";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { MobileDashboardHome } from "@/components/dashboard/MobileDashboardHome";
import { MobileAddSite } from "@/components/dashboard/MobileAddSite";
import { MobileAccount } from "@/components/dashboard/MobileAccount";
import { MobileSiteDetail } from "@/components/dashboard/MobileSiteDetail";
import { GoLiveButton } from "@/components/dashboard/GoLiveButton";
import { DesktopStepper } from "@/components/dashboard/DesktopStepper";
import { DesktopNextStepCard } from "@/components/dashboard/DesktopNextStepCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PUBLIC_CNAME_TARGET =
  process.env.NEXT_PUBLIC_CNAME_TARGET || "cname.vercel-dns.com";

function automationJobLabel(dedupeKey: string | null | undefined): string {
  if (!dedupeKey) return "Automation";
  if (dedupeKey.startsWith("auto_crawl_")) return "Site crawl & training";
  if (dedupeKey.startsWith("go_live_")) return "Domain (go live)";
  return "Automation";
}

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
  const buyCredits = searchParams.get("buyCredits");

  const displayName = getDisplayName(user);

  // Call dashboard/orders only when we have a signed-in user (avoids 401 after redirect).
  // Dashboard is for all signed-in users; payment is only required to run "Build my chatbot".
  const canCallApi = clerkLoaded && !!user;

  // Auth header so API routes get the session even when cookies aren't sent (e.g. after Google redirect).
  const authHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Optional: deep link to purchase credits (used when a rescan requires credits)
  useEffect(() => {
    if (!canCallApi) return;
    if (buyCredits !== "1") return;
    (async () => {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ pack: "1000" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && (json as { url?: string }).url) {
        window.location.href = (json as { url: string }).url;
      }
    })().catch(() => {});
  }, [canCallApi, buyCredits]);

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
        if (json.orderId) {
          const ordersRes = await fetch("/api/orders/me", { credentials: "include", headers: await authHeaders() });
          if (ordersRes.ok) setMyOrders(await ordersRes.json());
          router.replace(`/dashboard?orderId=${encodeURIComponent(json.orderId)}`);
          setMobileScreen("site-detail");
        }
      })().catch(() => {
        sessionStorage.setItem(PENDING_SCAN_URL_KEY, raw);
      });
    } catch {
      /* ignore */
    }
  }, [orderId, router, canCallApi]);
  const initials = getInitials(displayName);

  const [activePanel, setActivePanel] = useState<"training" | "design" | "domains">("training");
  const [accentDraft, setAccentDraft] = useState("#000000");
  const [brandingSaveState, setBrandingSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileSheetPanel>("design");
  const [mobileScreen, setMobileScreen] = useState<MobileScreen>("home");
  const [scanInitialUrl, setScanInitialUrl] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);
  const [scanNewSiteModalOpen, setScanNewSiteModalOpen] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [previewView, setPreviewView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const scanDropdownRef = useRef<HTMLDivElement>(null);

  const setMobilePanel = (panel: MobileSheetPanel) => {
    setMobileView(panel);
    if (panel === "design" || panel === "domains") setActivePanel(panel);
  };

  useEffect(() => {
    if (!scanDropdownOpen) return;
    const h = (e: MouseEvent) => {
      if (scanDropdownRef.current && !scanDropdownRef.current.contains(e.target as Node)) setScanDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [scanDropdownOpen]);

  // On mobile, when URL has orderId, show site-detail view
  useEffect(() => {
    if (typeof window === "undefined" || !orderId) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) setMobileScreen("site-detail");
  }, [orderId]);

  const [data, setData] = useState<{
    order: { id: string; status: string; amountCents: number; bundleYears: number; dnsHelp: boolean; planSlug?: string; addOns?: string[] };
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
    automationJobs?: {
      type: string;
      status: string;
      lastError: string | null;
      attempts: number;
      maxAttempts: number;
      updatedAt: string;
      dedupeKey: string | null;
    }[];
  } | null>(null);
  const [myOrders, setMyOrders] = useState<{
    order: { id: string; status?: string; planSlug?: string; amountCents?: number };
    customer: { businessName: string; websiteUrl: string; status?: string } | null;
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
  const [successToast, setSuccessToast] = useState<{ message: string; cta?: string; ctaHref?: string } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  /** Tracks last-seen automation state per order so poll-driven updates can show one-time toasts */
  const automationMilestoneRef = useRef<{
    orderId?: string;
    orderStatus?: string;
    contentCount?: number;
    customerStatus?: string;
    crawlJobStatus?: string;
    goLiveJobStatus?: string;
  }>({});

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

  // After payment: poll until crawl finishes and (if applicable) status reaches delivered (DNS + auto go-live).
  // Website-builder orders do not use this automated chatbot pipeline.
  useEffect(() => {
    const isWebsitePlan =
      data?.order?.planSlug && ["starter", "new-build", "redesign"].includes(data.order.planSlug);
    const cust = data?.customer?.status ?? "";
    const shouldPoll =
      !!data?.order?.id &&
      data.order.status === "paid" &&
      !isWebsitePlan &&
      ((data?.contentCount ?? 0) === 0 || ["crawling", "dns_setup", "testing"].includes(cust));
    if (!shouldPoll) return;
    const currentOrderId = orderId ?? data.order.id;
    let ticks = 0;
    const interval = setInterval(async () => {
      ticks++;
      if (ticks > 100) {
        clearInterval(interval);
        return;
      }
      const headers = await authHeaders();
      const url = currentOrderId
        ? `/api/dashboard?orderId=${encodeURIComponent(currentOrderId)}`
        : "/api/dashboard";
      const res = await fetch(url, { credentials: "include", cache: "no-store", headers: { ...headers } });
      if (!res.ok) return;
      const json = await res.json();
      setData(json);
      const nextStatus = json?.customer?.status ?? "";
      if (nextStatus === "delivered") {
        const h = await authHeaders();
        const r = await fetch("/api/orders/me", { credentials: "include", headers: { ...h } });
        if (r.ok) setMyOrders(await r.json());
        clearInterval(interval);
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [
    orderId,
    data?.order?.id,
    data?.order?.planSlug,
    data?.order?.status,
    data?.contentCount,
    data?.customer?.status,
  ]);

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
        if (res.status === 402 && (json as { purchaseEndpoint?: string }).purchaseEndpoint) {
          setCrawlError("Rescan requires credits. Buy a credit pack to continue.");
          setSuccessToast({ message: "Rescan requires credits.", cta: "Buy credits", ctaHref: "/dashboard?buyCredits=1" });
          setTimeout(() => setSuccessToast(null), 8000);
        } else {
          setCrawlError(json.error ?? "Crawl failed");
        }
        return;
      }
      const h = await authHeaders();
      const [dashRes, ordersRes] = await Promise.all([
        fetch(`/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`, { credentials: "include", headers: { ...h } }),
        fetch("/api/orders/me", { credentials: "include", headers: { ...h } }),
      ]);
      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        setData(dashJson);
        const oid = dashJson?.order?.id as string | undefined;
        if (oid && automationMilestoneRef.current.orderId === oid) {
          automationMilestoneRef.current.contentCount = dashJson?.contentCount ?? 0;
        }
      }
      if (ordersRes.ok) setMyOrders(await ordersRes.json());
      setSuccessToast({ message: "Content ready! Check your email for DNS instructions. Add your CNAME below to go live." });
      setActivePanel("domains");
      setTimeout(() => setSuccessToast(null), 8000);
    } catch {
      setCrawlError("Crawl failed");
    } finally {
      setCrawling(false);
    }
  };

  const refreshDashboard = useCallback(async () => {
    if (!canCallApi) return null;
    const headers = await authHeaders();
    const url = `/api/dashboard${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`;
    const res = await fetch(url, { credentials: "include", cache: "no-store", headers: { ...headers } });
    let json: unknown = null;
    if (res.ok) {
      json = await res.json();
      setData(json as typeof data);
    }
    const h2 = await authHeaders();
    const r2 = await fetch("/api/orders/me", { credentials: "include", headers: { ...h2 } });
    if (r2.ok) setMyOrders(await r2.json());
    return json;
  }, [canCallApi, orderId, getToken]);

  const handleGoLiveSuccess = useCallback(async () => {
    const json = (await refreshDashboard()) as {
      customer?: { subdomain?: string; domain?: string };
    } | null;
    const c = json?.customer;
    if (c?.subdomain && c?.domain) {
      setSuccessToast({
        message: "Your chatbot is live!",
        cta: "Visit your chat",
        ctaHref: `https://${c.subdomain}.${c.domain}`,
      });
      setTimeout(() => setSuccessToast(null), 6000);
    }
  }, [refreshDashboard]);

  const copyCname = () => {
    const cname = `Type: CNAME\nHost: ${customer?.subdomain ?? "chat"}\nValue: ${PUBLIC_CNAME_TARGET}`;
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
  const isWebsiteOrder = order?.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug);

  useEffect(() => {
    if (loading || error || !order?.id || !customer || isWebsiteOrder) return;

    const crawlJob = data?.automationJobs?.find((j) => j.dedupeKey === `auto_crawl_${order.id}`);
    const goLiveJob = data?.automationJobs?.find((j) => j.dedupeKey === `go_live_${customer.id}`);
    const crawlStatus = crawlJob?.status;
    const goLiveStatus = goLiveJob?.status;

    const r = automationMilestoneRef.current;
    if (r.orderId !== order.id) {
      automationMilestoneRef.current = {
        orderId: order.id,
        orderStatus: order.status,
        contentCount,
        customerStatus,
        crawlJobStatus: crawlStatus,
        goLiveJobStatus: goLiveStatus,
      };
      return;
    }

    const dismissMs = 9000;
    let t: ReturnType<typeof setTimeout> | undefined;

    if (order.status === "paid" && r.orderStatus && r.orderStatus !== "paid") {
      setErrorToast(null);
      setSuccessToast({
        message:
          "Payment confirmed — we're training your chatbot automatically. This usually takes a few minutes. We'll email you when your content is ready.",
      });
      t = setTimeout(() => setSuccessToast(null), dismissMs);
    }

    if ((r.contentCount ?? 0) === 0 && contentCount > 0) {
      setSuccessToast({
        message: `Training data ready — ${contentCount} page${contentCount === 1 ? "" : "s"} indexed. Check your email for DNS steps or open the Domains section.`,
      });
      t = setTimeout(() => setSuccessToast(null), 10_000);
    }

    if (customerStatus === "delivered" && r.customerStatus && r.customerStatus !== "delivered") {
      setSuccessToast({
        message: "Your chatbot is live!",
        cta: "Visit chat",
        ctaHref: `https://${customer.subdomain}.${customer.domain}`,
      });
      t = setTimeout(() => setSuccessToast(null), 10_000);
    }

    if (crawlStatus === "failed" && r.crawlJobStatus !== "failed") {
      setSuccessToast(null);
      const detail = crawlJob?.lastError?.trim();
      setErrorToast(
        detail
          ? `Automatic training failed: ${detail.slice(0, 220)}${detail.length > 220 ? "…" : ""} — use “Build my chatbot” to retry.`
          : "Automatic training failed. Use “Build my chatbot” to retry, or contact support if it keeps happening."
      );
      t = setTimeout(() => setErrorToast(null), 14_000);
    }

    if (goLiveStatus === "failed" && r.goLiveJobStatus !== "failed") {
      setSuccessToast(null);
      const detail = goLiveJob?.lastError?.trim();
      setErrorToast(
        detail
          ? `Go-live job failed: ${detail.slice(0, 220)}${detail.length > 220 ? "…" : ""} — check DNS or tap “Check DNS now” again.`
          : "We couldn't attach your domain automatically. Check your CNAME and try “Check DNS now” again."
      );
      t = setTimeout(() => setErrorToast(null), 14_000);
    }

    automationMilestoneRef.current = {
      orderId: order.id,
      orderStatus: order.status,
      contentCount,
      customerStatus,
      crawlJobStatus: crawlStatus,
      goLiveJobStatus: goLiveStatus,
    };

    return () => {
      if (t) clearTimeout(t);
    };
  }, [
    loading,
    error,
    order?.id,
    order?.status,
    customer?.id,
    contentCount,
    customerStatus,
    isWebsiteOrder,
    data?.automationJobs,
  ]);

  useEffect(() => {
    const hex = data?.customer?.primaryColor;
    setAccentDraft(typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000");
    setBrandingSaveState("idle");
  }, [data?.customer?.id, data?.customer?.primaryColor]);

  const notifications = useMemo(() => {
    type Config = { id: string; title: string; body: string };
    const configs: Config[] = [];
    configs.push({
      id: "welcome",
      title: "Welcome to ForwardSlash",
      body: "Your dashboard is where you'll manage your AI chatbot: add your site, train it on your content, and connect your domain. Need help? Reply to any email from us or use the support link in the footer.",
    });
    if (myOrders.length >= 1 && !hasPaidOrder && !isWebsiteOrder) {
      configs.push({ id: "site_added", title: "You added a site", body: "Complete checkout to unlock your AI chatbot. We'll train it on your content and deploy it at chat.yourdomain.com." });
    }
    if (isWebsiteOrder && isPaid) {
      configs.push({
        id: "website_order",
        title: "Website order confirmed",
        body: "We've received your payment for your website project. We'll reach out by email to get started — this is separate from our automated AI chatbot offering.",
      });
    }
    if (isPaid && contentCount === 0 && !isWebsiteOrder) {
      configs.push({ id: "payment_confirmed", title: "Payment confirmed", body: "We're building your chatbot automatically now. This usually takes a few minutes. If nothing happens after ~2 minutes, click “Build my chatbot” in Training." });
    }
    if (isPaid && contentCount > 0 && !isTestingOrLive) {
      configs.push({ id: "crawl_done", title: "Content ready", body: `We've crawled ${contentCount} pages. Your chatbot is being trained on your content. Add the CNAME from your email when you're ready—we'll attach your domain on Vercel automatically once DNS is correct.` });
    }
    const goLiveJob = data?.automationJobs?.find((j) => j.dedupeKey?.startsWith("go_live_"));
    const goLiveActive =
      goLiveJob && (goLiveJob.status === "queued" || goLiveJob.status === "running");
    if (isPaid && contentCount > 0 && customerStatus === "dns_setup" && goLiveActive) {
      configs.push({
        id: "dns_watching",
        title: "Watching your DNS",
        body: "We check regularly for your CNAME. When it propagates, we attach chat.yourdomain to Vercel for you. You can still use “Check DNS now” to retry verification.",
      });
    }
    if (isPaid && contentCount > 0 && isTestingOrLive && !isLive) {
      configs.push({ id: "domain_next", title: "Add your domain", body: "Your chatbot is ready for testing. Add the CNAME record we sent you (e.g. chat.yoursite.com). We’ll go live automatically when DNS points to Vercel." });
    }
    if (isLive) {
      configs.push({ id: "go_live", title: "Your chatbot is live", body: "Your AI chatbot is live at your domain. Share the link with customers and we'll keep it updated." });
    }
    return configs.map((c) => ({ id: c.id, title: c.title, body: c.body, read: notificationReadIds.has(c.id) }));
  }, [
    myOrders.length,
    hasPaidOrder,
    isPaid,
    contentCount,
    isTestingOrLive,
    isLive,
    notificationReadIds,
    isWebsiteOrder,
    data?.automationJobs,
    customerStatus,
  ]);

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

  const WEBSITE_PLAN_NAMES: Record<string, string> = {
    starter: "Quick WordPress Starter",
    "new-build": "Brand New Website Build",
    redesign: "Website Redesign / Refresh",
  };
  const ADD_ON_LABELS: Record<string, string> = {
    dns: "DNS Setup Help",
    "social-media": "Social Media Management",
    starter: "Quick WordPress Starter",
    "new-build": "Brand New Website Build",
    redesign: "Website Redesign",
  };

  const paymentReceived = ["paid", "processing", "delivered"].includes(order?.status ?? "");
  const paymentStepLabel = paymentReceived ? "Payment received" : "Complete payment";

  /** Chatbot orders: full automated pipeline. Website-builder SKUs: separate product (human-led milestones on the order). */
  const STATUS_STEPS = isWebsiteOrder
    ? [
        {
          key: "payment",
          label: paymentStepLabel,
          done: paymentReceived,
        },
        {
          key: "delivered",
          label: order?.status === "delivered" ? "Project delivered" : "Delivery & handoff",
          done: order?.status === "delivered",
        },
      ]
    : [
        { key: "payment", label: paymentStepLabel, done: paymentReceived },
        {
          key: "content",
          label: "Content & training",
          done:
            (contentCount ?? 0) > 0 || ["dns_setup", "testing", "delivered"].includes(customer?.status ?? ""),
        },
        { key: "dns", label: "DNS & domain", done: ["testing", "delivered"].includes(customer?.status ?? "") },
        { key: "live", label: "Chatbot live", done: customer?.status === "delivered" },
      ];

  const stepperPendingIndex = STATUS_STEPS.findIndex((s) => !s.done);
  const stepperCurrentIndex = stepperPendingIndex === -1 ? STATUS_STEPS.length - 1 : stepperPendingIndex;

  const DESKTOP_STEPPER_STEPS = isWebsiteOrder
    ? [
        { ...STATUS_STEPS[0], icon: CreditCard },
        { ...STATUS_STEPS[1], icon: PackageCheck },
      ]
    : [
        { ...STATUS_STEPS[0], icon: CreditCard },
        { ...STATUS_STEPS[1], icon: Layers },
        { ...STATUS_STEPS[2], icon: Globe2 },
        { ...STATUS_STEPS[3], icon: Sparkles },
      ];

  const estimatedPageTotal = Math.max(
    1,
    myOrders.find((o) => o.order.id === order?.id)?.estimatedPages ?? 25
  );

  const chatbotCheckoutHref =
    customer && order
      ? `/checkout?plan=chatbot-2y&pages=${estimatedPageTotal}&url=${encodeURIComponent(customer.websiteUrl ?? "")}&orderId=${encodeURIComponent(order.id)}`
      : "/checkout?plan=chatbot-2y&pages=25";

  const websiteCheckoutHref =
    order && customer && order.planSlug && ["starter", "new-build", "redesign"].includes(order.planSlug)
      ? `/checkout?plan=${order.planSlug}&url=${encodeURIComponent(customer.websiteUrl ?? "")}&orderId=${encodeURIComponent(order.id)}`
      : "/checkout?plan=starter&pages=25";

  const handleSaveBranding = async () => {
    const c = data?.customer;
    if (!c) return;
    setBrandingSaveState("saving");
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch(`/api/customers/${c.id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ primaryColor: accentDraft }),
      });
      if (!res.ok) throw new Error("Save failed");
      setBrandingSaveState("saved");
      setData((d) => (d?.customer ? { ...d, customer: { ...d.customer, primaryColor: accentDraft } } : d));
      setTimeout(() => setBrandingSaveState("idle"), 2500);
    } catch {
      setBrandingSaveState("error");
    }
  };

  const handleDiscardBranding = () => {
    const hex = data?.customer?.primaryColor;
    setAccentDraft(typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000");
    setBrandingSaveState("idle");
  };

  return (
    <main className="min-h-screen bg-background">
      {/*
        Desktop (md+): compact shell — short header, dense stepper strip, slim sidebar, then
        xl: two columns (~58% work / ~42% live preview). One checkout CTA when unpaid (Next step card);
        sidebar bundle CTA hidden on that screen to reduce noise. Training holds crawl/rescan only after pay.
      */}
      <div className="hidden md:flex md:flex-col md:h-screen md:max-h-[100dvh] overflow-hidden">
      {/* App header */}
      <div className="flex items-center justify-between h-12 px-4 sm:px-6 xl:px-8 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-foreground truncate">ForwardSlash.Chat</span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground font-medium truncate">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline">
            Home
          </Link>
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

      {hasOrder && (
        <div className="shrink-0 border-b border-border/80 bg-muted/15">
          <div className="py-3 md:py-3.5 space-y-2">
            <DesktopStepper steps={DESKTOP_STEPPER_STEPS} currentIndex={stepperCurrentIndex} />
            {isWebsiteOrder && isPaid && order?.status !== "delivered" && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Website-builder order — we&apos;ll coordinate by email (not the automated chatbot pipeline).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 min-w-0">
        {/* Sidebar - collapsible on desktop, hidden on mobile */}
        <aside
          className={`hidden md:flex border-r border-sidebar-border bg-sidebar flex-col shrink-0 transition-[width] duration-200 ${
            sidebarCollapsed ? "w-14 p-2" : "w-56 p-3"
          }`}
        >
          <div className={`flex items-center gap-2 mb-4 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-medium">{initials}</span>
            </div>
            {!sidebarCollapsed && <span className="text-sm font-medium text-foreground truncate">{displayName}</span>}
          </div>

          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setScanNewSiteModalOpen(true)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground mb-2"
              title="Scan new site"
            >
              <Globe className="w-5 h-5" />
            </button>
          ) : (
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
                      {myOrders.map(({ order: o, customer: c, estimatedPages: ep }) => {
                        const isWeb = o.planSlug && ["starter", "new-build", "redesign"].includes(o.planSlug);
                        return (
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
                          <span className="text-xs text-muted-foreground shrink-0">
                            {isWeb ? WEBSITE_PLAN_NAMES[o.planSlug!]?.split(" ")[0] ?? "Web" : `~${ep} pg`}
                          </span>
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
                      );})}
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
          )}

          <nav className={`space-y-1 flex-1 ${sidebarCollapsed ? "flex flex-col items-center" : ""}`}>
            <button
              type="button"
              onClick={() => setActivePanel("training")}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-sm rounded-lg text-left transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${activePanel === "training" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"}`}
              title="Training"
            >
              <span className="w-5 shrink-0 flex justify-center">
                {contentCount > 0 ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <GraduationCap className="w-4 h-4 opacity-70" />}
              </span>
              {!sidebarCollapsed && "Training"}
            </button>
            <button
              type="button"
              onClick={() => setActivePanel("design")}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-sm rounded-lg text-left transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${activePanel === "design" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"}`}
              title="Design"
            >
              <span className="w-5 shrink-0 flex justify-center">
                {customer && contentCount > 0 ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Palette className="w-4 h-4 opacity-70" />}
              </span>
              {!sidebarCollapsed && "Design"}
            </button>
            <button
              onClick={() => setActivePanel("domains")}
              title={!sidebarCollapsed && !isWebsiteOrder && (contentCount ?? 0) === 0 ? "Complete Training first" : "Domain"}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-sm rounded-lg text-left transition-colors ${sidebarCollapsed ? "justify-center" : ""} ${activePanel === "domains" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"}`}
            >
              <span className="w-5 shrink-0 flex justify-center">
                {["testing", "delivered"].includes(customer?.status ?? "") ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : !isWebsiteOrder && (contentCount ?? 0) === 0 ? (
                  <Lock className="w-4 h-4 text-muted-foreground/60" />
                ) : (
                  <Link2 className="w-4 h-4 opacity-70" />
                )}
              </span>
              {!sidebarCollapsed && "Domain"}
            </button>
          </nav>

          {!sidebarCollapsed && (
            <>
              <button
                onClick={() => setUpsellModalOpen(true)}
                className="w-full mt-4 p-3 rounded-lg bg-white dark:bg-zinc-800 border border-border text-left hover:shadow-md transition-shadow"
              >
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Also from us</p>
                <p className="text-xs font-semibold text-foreground mt-0.5">Web design & marketing</p>
                <p className="text-[10px] text-muted-foreground mt-1">Full overhauls for local businesses →</p>
              </button>
              <div className="pt-4 border-t border-border mt-3">
                {(() => {
                  const hasPaidOrder = myOrders.some((o) => o.order.status === "paid");
                  const totalPages = myOrders.reduce((s, o) => s + (o.estimatedPages ?? 25), 0);
                  const totalCrawled = myOrders.reduce((s, o) => s + (o.contentCount ?? 0), 0);
                  const selectedPages = myOrders
                    .filter((o) => cartSelectedIds.has(o.order.id))
                    .reduce((s, o) => s + (o.estimatedPages ?? 25), 0);
                  const cartPrice = getPriceFromPagesAndYears(selectedPages, 2);
                  const hasSites = myOrders.length > 0;
                  const viewingUnpaidChatbotOrder = !!(order && customer && !isPaid && !isWebsiteOrder);
                  return (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
                      <Badge
                        variant="outline"
                        className={`mt-1.5 tabular-nums text-xs font-medium ${
                          totalCrawled > 0 ? "border-emerald-500/40 text-emerald-800 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {totalCrawled} / {totalPages > 0 ? totalPages : "—"} crawled
                      </Badge>
                      {hasSites && !hasPaidOrder && !viewingUnpaidChatbotOrder && (
                        <Button
                          type="button"
                          variant="cta"
                          size="sm"
                          className="w-full mt-3 font-semibold shadow-sm hover:shadow-md transition-shadow"
                          onClick={openCartModal}
                        >
                          Bundle all sites — ${cartPrice?.toLocaleString() ?? "—"}
                        </Button>
                      )}
                      {hasSites && !hasPaidOrder && viewingUnpaidChatbotOrder && (
                        <button
                          type="button"
                          onClick={openCartModal}
                          className="mt-3 w-full text-left text-[11px] text-primary font-medium hover:underline"
                        >
                          Multiple sites? Open bundle checkout →
                        </button>
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
            </>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className={`mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors ${sidebarCollapsed ? "w-full" : "w-full"}`}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </aside>

        <div className="flex flex-1 min-h-0 min-w-0 flex-col xl:flex-row">
        {/* Work area ~58% at xl — compact cards + panels; preview ~42% */}
        <div
          className={`flex flex-col min-h-0 min-w-0 overflow-hidden border-b xl:border-b-0 xl:border-r border-border/80 bg-background/50 xl:w-[58%] xl:max-w-3xl xl:shrink-0 flex-1 xl:flex-none ${mobileView === "preview" ? "max-md:hidden" : ""}`}
        >
          {successToast && (
            <div className="flex items-center justify-between gap-3 p-3 bg-emerald-500/15 border-b border-emerald-500/30 shrink-0">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                {successToast.message}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {successToast.cta && successToast.ctaHref && (
                  <a
                    href={successToast.ctaHref}
                    target={successToast.ctaHref.startsWith("http") ? "_blank" : undefined}
                    rel={successToast.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium text-emerald-600 hover:underline"
                  >
                    {successToast.cta}
                  </a>
                )}
                <button onClick={() => setSuccessToast(null)} className="p-1 rounded hover:bg-emerald-500/20 text-muted-foreground" aria-label="Dismiss">×</button>
              </div>
            </div>
          )}
          {errorToast && (
            <div className="flex items-center justify-between gap-3 p-3 bg-destructive/10 border-b border-destructive/30 shrink-0">
              <p className="text-sm font-medium text-foreground pr-2">{errorToast}</p>
              <button
                type="button"
                onClick={() => setErrorToast(null)}
                className="p-1 rounded hover:bg-destructive/15 text-muted-foreground shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          <div className={`flex-1 overflow-y-auto max-md:pb-24 ${activePanel === "domains" ? "p-5" : "p-4 md:p-5 xl:p-6"} space-y-5`}>
          {hasOrder && customer && (
            <DesktopNextStepCard
              isWebsiteOrder={!!isWebsiteOrder}
              hasOrder={hasOrder}
              customer={customer}
              isPaid={isPaid}
              isLive={isLive}
              contentCount={contentCount}
              customerStatus={customerStatus}
              crawling={crawling}
              copied={copied}
              chatbotCheckoutHref={chatbotCheckoutHref}
              websiteCheckoutHref={websiteCheckoutHref}
              copyCname={copyCname}
              setActivePanel={setActivePanel}
              handleGoLiveSuccess={handleGoLiveSuccess}
              authHeaders={authHeaders}
              orderDelivered={order?.status === "delivered"}
            />
          )}
          {activePanel === "training" && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
                <div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Training</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-md">
                    {hasOrder && !isPaid && !isWebsiteOrder
                      ? "Pay in Next step — then run your first crawl here."
                      : "Crawl your site and train the assistant on your pages."}
                  </p>
                </div>
                {hasOrder && customer && !isWebsiteOrder && (
                  <Badge variant="outline" className="shrink-0 tabular-nums text-[11px] font-medium text-muted-foreground">
                    {contentCount} / {estimatedPageTotal} pages
                  </Badge>
                )}
              </div>
              {customer && !isWebsiteOrder && hasOrder && !isPaid && contentCount > 0 && (
                <div className="mb-4 rounded-md border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs leading-snug">
                  <span className="font-medium text-foreground">{contentCount} pages indexed</span>
                  <span className="text-muted-foreground"> — complete payment in Next step to train.</span>
                </div>
              )}
              {customer && !isWebsiteOrder && hasOrder && !isPaid && contentCount === 0 && (
                <p className="text-xs text-muted-foreground mb-4 leading-snug">
                  Complete payment in <strong className="text-foreground font-medium">Next step</strong>, then start your crawl below.
                </p>
              )}

              {!hasOrder ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Welcome, {displayName}. Get your AI chatbot by completing checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setScanNewSiteModalOpen(true)}
                    className="block w-full px-3 py-2 text-sm text-center border border-border rounded hover:bg-muted"
                  >
                    Scan your site
                  </button>
                  <Link href="/checkout?plan=chatbot-2y&pages=25" className="block w-full px-3 py-2 text-sm text-center bg-primary text-primary-foreground rounded hover:opacity-90">
                    Get started →
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    One payment. Your domain. Hosting included.
                  </p>
                </div>
              ) : isWebsiteOrder ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Your website order</h4>
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium text-foreground">
                        {order?.planSlug ? WEBSITE_PLAN_NAMES[order.planSlug] ?? order.planSlug : "Website"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium text-foreground">
                        ${((order?.amountCents ?? 0) / 100).toLocaleString()}
                      </span>
                    </div>
                    {(order?.addOns?.length ?? 0) > 0 && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground block mb-1">Add-ons</span>
                        <ul className="text-sm text-foreground space-y-0.5">
                          {order?.addOns?.map((id) => (
                            <li key={id}>{ADD_ON_LABELS[id] ?? id}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div><span className="text-xs text-muted-foreground">Business</span><p className="text-sm text-foreground">{customer?.businessName ?? "—"}</p></div>
                    <div><span className="text-xs text-muted-foreground">Domain</span><p className="text-sm text-foreground">{customer?.domain ?? "—"}</p></div>
                    <div><span className="text-xs text-muted-foreground">Website</span><p className="text-sm text-foreground truncate">{customer?.websiteUrl ?? "—"}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Looking for the hands-off AI chatbot (train on your site + live on chat.yourdomain.com)?{" "}
                    <Link href="/checkout?plan=chatbot-2y&pages=25" className="text-primary hover:underline">
                      Chatbot checkout
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Questions?{" "}
                    <a href="mailto:hello@forwardslash.chat" className="text-primary hover:underline">
                      hello@forwardslash.chat
                    </a>
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {isPaid && (data?.automationJobs?.length ?? 0) > 0 && (
                    <div className="rounded-lg border border-border bg-muted/25 p-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Automation status</p>
                      <ul className="space-y-2">
                        {(data?.automationJobs ?? []).map((job) => (
                          <li
                            key={job.dedupeKey ?? job.type}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-foreground">{automationJobLabel(job.dedupeKey)}</span>
                            <span
                              className={
                                job.status === "failed"
                                  ? "text-destructive font-medium"
                                  : job.status === "running"
                                    ? "text-amber-600 dark:text-amber-400 font-medium"
                                    : job.status === "succeeded"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-muted-foreground"
                              }
                            >
                              {job.status === "queued"
                                ? "Queued"
                                : job.status === "running"
                                  ? "Running…"
                                  : job.status === "succeeded"
                                    ? "Complete"
                                    : job.status === "failed"
                                      ? "Failed"
                                      : job.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {(data?.automationJobs ?? []).some((j) => j.status === "failed") && (
                        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                          Fix the issue above or retry from this page. We&apos;ll email you when major steps finish.
                        </p>
                      )}
                    </div>
                  )}
                  {isPaid && (
                    <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">Pages indexed</span>
                        <span>
                          {contentCount} / {estimatedPageTotal}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
                          style={{
                            width: `${Math.min(100, Math.round((contentCount / estimatedPageTotal) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {customer &&
                    !isWebsiteOrder &&
                    hasOrder &&
                    isPaid &&
                    (["content_collection", "crawling", "indexing"].includes(customer.status) ||
                      (contentCount > 0 && ["dns_setup", "testing", "delivered"].includes(customer.status))) && (
                      <div className="space-y-2">
                        {lastCrawled && (
                          <p className="text-xs text-muted-foreground">
                            Last scanned: {lastCrawled.toLocaleDateString()}
                            {!canRescan && nextCrawlAvailable && contentCount > 0 && (
                              <span className="block">
                                Rescan in {Math.ceil((nextCrawlAvailable.getTime() - Date.now()) / (24 * 60 * 60 * 1000))}{" "}
                                days
                              </span>
                            )}
                          </p>
                        )}
                        <Button
                          type="button"
                          variant="default"
                          className={`w-full font-semibold ${crawling ? "animate-pulse" : ""}`}
                          onClick={handleCrawl}
                          disabled={
                            crawling ||
                            (!canRescan && contentCount > 0) ||
                            (contentCount === 0 && customer.status === "crawling")
                          }
                        >
                          {crawling
                            ? "Crawling…"
                            : contentCount
                              ? canRescan
                                ? "Rescan site"
                                : "Rescan (7-day cooldown)"
                              : customer.status === "crawling"
                                ? "Building…"
                                : "Build my chatbot"}
                        </Button>
                        {(crawling || contentCount === 0) && (
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">
                            Usually 2–8 minutes. We&apos;ll email when ready.
                          </p>
                        )}
                        {crawlError && <p className="text-xs text-destructive mt-1">{crawlError}</p>}
                      </div>
                    )}
                </div>
              )}
            </>
          )}

          {activePanel === "design" && (
            <>
              <div className="mb-5 pb-2 border-b border-border/60">
                <h2 className="text-base font-semibold text-foreground tracking-tight">Branding</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Changes show in the live preview — adjust accent color to match your brand.
                </p>
              </div>
              {!hasOrder ? (
                <p className="text-sm text-muted-foreground">Complete checkout to customize how your chatbot looks.</p>
              ) : isWebsiteOrder ? (
                <p className="text-sm text-muted-foreground">
                  Branding applies to AI chatbot orders. Your website package uses the details we&apos;ll collect with you
                  directly.
                </p>
              ) : (
                <div className="space-y-6 rounded-xl border border-border bg-card/50 p-4 md:p-5 shadow-sm">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display name</label>
                    <p className="text-sm text-foreground mt-1.5">{customer?.businessName ?? "—"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Logo</label>
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mt-2 border border-border">
                        <span className="text-foreground text-sm font-semibold">{(customer?.businessName ?? "?")[0]}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Favicon</label>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mt-2 border border-border"
                        style={{ backgroundColor: accentDraft }}
                      >
                        <span className="text-white text-xs drop-shadow-sm">✦</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Header preview</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-medium"
                        style={{ backgroundColor: accentDraft }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{customer?.businessName ?? "Chatbot"}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                      Accent color
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        type="color"
                        value={accentDraft}
                        onChange={(e) => setAccentDraft(e.target.value)}
                        className="h-11 w-14 rounded-lg cursor-pointer border border-border bg-transparent p-1"
                        aria-label="Accent color"
                      />
                      <span className="text-xs text-muted-foreground">Updates the preview instantly</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={handleDiscardBranding}
                      className="px-4 py-2 text-sm border border-border rounded-lg text-foreground hover:bg-muted/60"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBranding}
                      disabled={brandingSaveState === "saving"}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {brandingSaveState === "saving" ? "Saving…" : brandingSaveState === "saved" ? "Saved" : "Save"}
                    </button>
                    {brandingSaveState === "error" && (
                      <span className="text-xs text-destructive self-center">Could not save. Try again.</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activePanel === "domains" && (
            <>
              <div className="mb-6 pb-2 border-b border-border/60">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">Domain</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">Connect chat.yourdomain.com when your content is ready.</p>
              </div>
              {isWebsiteOrder ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Your website will be built and deployed to your domain. We&apos;ll handle hosting and DNS setup as part of your package.
                  </p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Domain: </span>
                    <span className="font-medium text-foreground">{customer?.domain ?? "—"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll reach out when it&apos;s time to connect your domain.
                  </p>
                </div>
              ) : customer && (contentCount ?? 0) > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">Add this CNAME record to your DNS:</p>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border pr-12">
                      {`Type: CNAME\nHost: ${customer.subdomain}\nValue: ${PUBLIC_CNAME_TARGET}`}
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
                    <GoLiveButton
                      customerId={customer.id}
                      customerDomain={`${customer.subdomain}.${customer.domain}`}
                      onSuccess={handleGoLiveSuccess}
                      authHeaders={authHeaders}
                      className="mt-4"
                    />
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
              ) : customer ? (
                <div className="p-6 rounded-xl bg-muted/50 border border-border">
                  <p className="text-sm font-medium text-foreground mb-1">Complete Training first</p>
                  <p className="text-sm text-muted-foreground mb-4">Build your chatbot to crawl your site. Then you&apos;ll unlock domain setup to go live at chat.yourdomain.com.</p>
                  <button
                    type="button"
                    onClick={() => setActivePanel("training")}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    Go to Training →
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete checkout to set up your domain. <Link href="/checkout?plan=chatbot-2y&pages=25" className="text-primary hover:underline">Go to checkout</Link>
                </p>
              )}
            </>
          )}

          </div>
        </div>

        {/* Live preview — right column, framed widget */}
        <div
          className={`flex-1 min-h-0 min-w-0 flex flex-col p-4 md:p-5 xl:p-6 bg-gradient-to-br from-muted/10 via-background to-muted/20 max-md:pb-24 ${
            mobileView === "preview" ? "max-md:flex" : "max-md:hidden"
          }`}
        >
          {isWebsiteOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full">
                <h3 className="font-medium text-foreground mb-2">Your website order</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {order?.planSlug ? WEBSITE_PLAN_NAMES[order.planSlug] ?? order.planSlug : "Website"} — ${((order?.amountCents ?? 0) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order?.status === "delivered" ? (
                    <>
                      Status: <span className="text-foreground font-medium">Project complete</span>
                    </>
                  ) : order?.status === "paid" || order?.status === "processing" ? (
                    <>
                      Status: <span className="text-foreground font-medium">In progress</span>
                      <span className="block mt-1 text-muted-foreground font-normal">
                        We&apos;ll email you with next steps for your website build.
                      </span>
                    </>
                  ) : (
                    <>
                      Status: <span className="capitalize text-foreground">{order?.status ?? "pending"}</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  We&apos;ll be in touch by email to start your project.
                </p>
              </div>
            </div>
          ) : customer ? (
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              {/* Device view toggle + preview frame */}
              <div className="flex items-start justify-between gap-3 mb-3 shrink-0">
                <div>
                  <h2 className="text-base font-semibold text-foreground tracking-tight">Live preview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-sm leading-snug">
                    Branded widget + sample thread — send a message to try it.
                  </p>
                </div>
                <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/50 border border-border/80 shadow-sm shrink-0">
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
              <div className="flex-1 flex justify-center items-stretch min-h-0 overflow-x-auto p-1 md:p-2 xl:p-0 transition-[width] duration-200">
                <div
                  className={`flex flex-col h-full min-h-[380px] xl:min-h-[520px] max-h-full bg-card border border-border/90 overflow-hidden shadow-[0_24px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.04] dark:ring-white/[0.06] transition-all duration-200 shrink-0 ${
                    previewView === "desktop" ? "rounded-2xl w-full max-w-4xl" : previewView === "tablet" ? "rounded-2xl" : "rounded-[2rem]"
                  }`}
                  style={
                    previewView === "tablet"
                      ? { width: 768, minWidth: 768 }
                      : previewView === "mobile"
                        ? { width: 390, minWidth: 390 }
                        : undefined
                  }
                >
                  <CustomerChat
                    customerId={customer.id}
                    businessName={customer.businessName}
                    primaryColor={accentDraft || customer.primaryColor || "#000000"}
                    compact={false}
                    previewDemo
                  />
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
      </div>
      </div>

      {/* Mobile: Rork-style shell (tab bar + home / add / account / site-detail) */}
      <div className="md:hidden flex flex-col min-h-screen bg-background">
        {mobileScreen === "site-detail" && orderId && data?.order?.id === orderId ? (
          <MobileSiteDetail
            siteData={{
              order: data.order,
              customer: data.customer ?? null,
              contentCount: data.contentCount ?? 0,
            }}
            estimatedPages={myOrders.find((o) => o.order.id === orderId)?.estimatedPages ?? 25}
            onBack={() => {
              setMobileScreen("home");
              router.replace("/dashboard");
            }}
            onRescan={handleCrawl}
            crawling={crawling}
            canRescan={canRescan}
            copied={copied}
            onCopyUrl={copyCname}
            authHeaders={authHeaders}
            onGoLiveSuccess={handleGoLiveSuccess}
          />
        ) : mobileScreen === "site-detail" && orderId ? (
          <div className="flex flex-col flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">Loading site…</p>
            <button
              type="button"
              onClick={() => { setMobileScreen("home"); router.replace("/dashboard"); }}
              className="mt-4 text-sm text-primary"
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
              <span className="text-sm font-medium text-foreground">ForwardSlash.Chat</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserButton afterSignOutUrl="/" />
              </div>
            </header>
            <div className="flex-1 overflow-auto min-h-0">
              {mobileScreen === "home" && (
                <MobileDashboardHome
                  displayName={displayName}
                  orders={myOrders}
                  onSelectSite={(id) => {
                    router.replace(`/dashboard?orderId=${encodeURIComponent(id)}`);
                    setMobileScreen("site-detail");
                  }}
                  onGoToAddSite={() => setMobileScreen("add")}
                />
              )}
              {mobileScreen === "add" && (
                <MobileAddSite
                  onScan={(url) => {
                    setScanInitialUrl(url);
                    setScanNewSiteModalOpen(true);
                  }}
                />
              )}
              {mobileScreen === "account" && (
                <MobileAccount
                  displayName={displayName}
                  email={user?.primaryEmailAddress?.emailAddress}
                  initials={initials}
                  totalSites={myOrders.length}
                  liveSites={myOrders.filter((o) => o.customer?.status === "delivered" || (o.order.planSlug && ["starter", "new-build", "redesign"].includes(o.order.planSlug) && o.order.status === "delivered")).length}
                  investedCents={myOrders.reduce((sum, o) => sum + (o.order.amountCents ?? 0), 0)}
                />
              )}
            </div>
            <MobileBottomNav current={mobileScreen} onSelect={setMobileScreen} />
          </>
        )}
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
        onClose={() => {
          setScanNewSiteModalOpen(false);
          setScanInitialUrl("");
        }}
        url={scanInitialUrl || ""}
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
              setScanNewSiteModalOpen(false);
              setScanInitialUrl("");
              const ordersRes = await fetch("/api/orders/me", { credentials: "include", headers: await authHeaders() });
              if (ordersRes.ok) setMyOrders(await ordersRes.json());
              router.replace(`/dashboard?orderId=${encodeURIComponent(json.orderId)}`);
              setMobileScreen("site-detail");
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
                  After payment, we start building your chatbot automatically. You can also click &quot;Build my chatbot&quot; any time to kick off a crawl.
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
