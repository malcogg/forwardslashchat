"use client";

import { ChevronRight } from "lucide-react";
import type { OrderRow } from "./mobile-types";
import { getSiteStatusLabel, getSiteStatusDot, getPlanLabel, getProgressSteps } from "./mobile-types";

type MobileDashboardHomeProps = {
  displayName: string;
  orders: OrderRow[];
  onSelectSite: (orderId: string) => void;
  onGoToAddSite: () => void;
  onOpenBundles: () => void;
};

export function MobileDashboardHome({
  displayName,
  orders,
  onSelectSite,
  onGoToAddSite,
  onOpenBundles,
}: MobileDashboardHomeProps) {
  const totalSites = orders.length;
  const liveCount = orders.filter(
    (o) => o.customer?.status === "delivered" || (o.order.planSlug && ["starter", "new-build", "redesign"].includes(o.order.planSlug) && o.order.status === "delivered")
  ).length;
  const trainingCount = orders.filter((o) => {
    const isWeb = o.order.planSlug && ["starter", "new-build", "redesign"].includes(o.order.planSlug);
    if (isWeb) return o.order.status !== "delivered";
    return o.customer?.status !== "delivered" && (o.order.status === "paid" || (o.contentCount ?? 0) > 0);
  }).length;

  const firstName = displayName.split(" ")[0] || "there";

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground mt-1">
        Hey, {firstName}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5 mb-6">
        Your AI chatbot dashboard
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{totalSites}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Sites</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{liveCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Live</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-2xl font-bold text-foreground">{trainingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Training</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenBundles}
        className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
      >
        Bundles & checkout
      </button>

      <h2 className="text-sm font-semibold text-foreground mb-3">Your Sites</h2>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">No sites yet. Add one to get started.</p>
          <button
            type="button"
            onClick={onGoToAddSite}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Add a site
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((row) => {
            const statusLabel = getSiteStatusLabel(row.order, row.customer, row.contentCount);
            const dot = getSiteStatusDot(row.order, row.customer, row.contentCount);
            const planLabel = getPlanLabel(row.order, row.estimatedPages);
            const steps = getProgressSteps(row.order, row.customer, row.contentCount);
            const displayUrl = row.customer?.websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? row.customer?.businessName ?? "Site";

            return (
              <li key={row.order.id}>
                <button
                  type="button"
                  onClick={() => onSelectSite(row.order.id)}
                  className="w-full text-left rounded-xl border border-border bg-card p-4 shadow-sm hover:bg-muted/30 active:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                        dot === "live"
                          ? "bg-emerald-500"
                          : dot === "domain"
                            ? "bg-amber-500"
                            : "bg-muted-foreground/60"
                      }`}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{row.customer?.businessName || displayUrl}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{displayUrl}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {row.contentCount} pages · {planLabel}
                      </p>
                      <div className="flex items-center gap-1 mt-3">
                        {steps.map((s) => (
                          <span
                            key={s.key}
                            className={`flex-1 h-1.5 rounded-full ${
                              s.done ? "bg-emerald-500" : "bg-muted"
                            }`}
                            title={s.label}
                            aria-hidden
                          />
                        ))}
                      </div>
                      <span
                        className={`inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded ${
                          statusLabel === "Live" || statusLabel === "Delivered"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : statusLabel === "Domain" ||
                                statusLabel === "In progress" ||
                                statusLabel === "Indexing" ||
                                statusLabel === "Ready to scan"
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {orders.length > 0 && (
        <button
          type="button"
          onClick={onGoToAddSite}
          className="mt-4 w-full py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          + Add another site
        </button>
      )}
    </div>
  );
}
