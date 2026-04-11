"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import type { OrderRow } from "@/components/dashboard/mobile-types";
import { getPlanLabel, getSiteStatusLabel } from "@/components/dashboard/mobile-types";

function formatMoney(cents: number | undefined) {
  return ((cents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function DashboardBillingPage() {
  const { isLoaded, userId } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/orders/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setError("Could not load orders.");
          return;
        }
        const json = (await res.json()) as OrderRow[];
        if (!cancelled) setOrders(Array.isArray(json) ? json : []);
      } catch {
        if (!cancelled) setError("Could not load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-muted text-foreground"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Billing & orders</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!isLoaded || loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link href="/dashboard" className="inline-block mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Go to dashboard
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((row) => {
              const label = getSiteStatusLabel(row.order, row.customer, row.contentCount);
              const plan = getPlanLabel(row.order, row.estimatedPages);
              const displayUrl =
                row.customer?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
                row.customer?.businessName ??
                "Site";
              const orderStatus = row.order.status ?? "";
              const paid = ["paid", "processing", "delivered"].includes(orderStatus);
              const isWebsite =
                row.order.planSlug && ["starter", "new-build", "redesign"].includes(row.order.planSlug);
              const checkoutHref =
                isWebsite && row.customer && row.order.id && row.order.planSlug
                  ? `/checkout?plan=${row.order.planSlug}&url=${encodeURIComponent(row.customer.websiteUrl ?? "")}&orderId=${encodeURIComponent(row.order.id)}`
                  : row.customer && row.order.id
                    ? `/checkout?plan=chatbot-2y&pages=${row.estimatedPages}&url=${encodeURIComponent(row.customer.websiteUrl ?? "")}&orderId=${encodeURIComponent(row.order.id)}`
                    : `/checkout?plan=chatbot-2y&pages=${row.estimatedPages}`;

              return (
                <li key={row.order.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-between gap-2 items-start">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{displayUrl}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded ${
                        paid ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-3 pt-3 border-t border-border">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium text-foreground">{formatMoney(row.order.amountCents)}</span>
                  </div>
                  {!paid && (
                    <Link
                      href={checkoutHref}
                      className="mt-3 block w-full text-center py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Complete payment
                    </Link>
                  )}
                  <Link
                    href={`/dashboard?orderId=${encodeURIComponent(row.order.id)}`}
                    className="mt-2 block text-center text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Open in dashboard
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
