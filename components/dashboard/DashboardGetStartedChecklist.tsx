"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ListChecks, X, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "fs_dashboard_checklist_dismissed_";

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  done: boolean;
};

type Props = {
  orderId: string;
  items: ChecklistItem[];
  /** Shown on primary button when unpaid */
  checkoutHref: string;
  unpaidQuoteDollars: number | null;
  isPaid: boolean;
  liveChatUrl: string | null;
  onContinueSetup: () => void;
  /** Docked in dashboard sidebar (default); floating was legacy centered overlay */
  layout?: "sidebar" | "floating";
};

export function DashboardGetStartedChecklist({
  orderId,
  items,
  checkoutHref,
  unpaidQuoteDollars,
  isPaid,
  liveChatUrl,
  onContinueSetup,
  layout = "sidebar",
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const [expanded, setExpanded] = useState(layout === "sidebar" ? false : true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(`${STORAGE_PREFIX}${orderId}`) === "1");
    } catch {
      setDismissed(false);
    }
  }, [orderId]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${orderId}`, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, [orderId]);

  const completed = useMemo(() => items.filter((i) => i.done).length, [items]);
  const total = items.length;
  const allDone = total > 0 && completed === total;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const primaryLabel = useMemo(() => {
    if (!isPaid && unpaidQuoteDollars != null) {
      return `Continue to checkout — $${unpaidQuoteDollars.toLocaleString()}`;
    }
    if (!isPaid) return "Continue to checkout";
    if (allDone && liveChatUrl) return "Open your chatbot";
    return "Continue setup";
  }, [isPaid, unpaidQuoteDollars, allDone, liveChatUrl]);

  if (dismissed || total === 0) return null;

  const sidebar = layout === "sidebar";
  const ringSize = sidebar ? "h-8 w-8" : "h-10 w-10";
  const iconTile = sidebar ? "h-8 w-8" : "h-10 w-10";

  return (
    <div
      className={cn(
        "overflow-y-auto overscroll-contain rounded-xl border border-border bg-card text-card-foreground ring-1 ring-black/5 dark:ring-white/10",
        sidebar
          ? "relative z-0 mt-3 w-full max-h-[min(48vh,360px)] shadow-sm"
          : "fixed z-50 left-1/2 top-1/2 w-[min(calc(100vw-1.5rem),380px)] max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl",
      )}
      role="region"
      aria-label="Get started checklist"
    >
      <div className={cn("border-b border-border flex items-start gap-2", sidebar ? "px-2.5 py-2" : "px-4 py-3 gap-3")}>
        <div
          className={cn(
            "rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md",
            iconTile,
          )}
        >
          <ListChecks className={cn("text-white", sidebar ? "h-4 w-4" : "h-5 w-5")} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={cn("font-semibold text-foreground leading-tight", sidebar ? "text-xs" : "text-sm")}>
            Get started checklist
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{completed} of {total} complete</p>
        </div>
        <div className={cn("relative shrink-0", ringSize)} aria-hidden>
          <svg className={cn("-rotate-90", ringSize)} viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-border" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(progressPct / 100) * 97.4} 97.4`}
            />
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
            {completed}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse checklist" : "Expand checklist"}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <>
          <ul className={cn("space-y-2", sidebar ? "px-2.5 py-2" : "px-4 py-3 space-y-3")}>
            {items.map((item) => (
              <li key={item.id} className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted/60">
                  {item.done ? (
                    <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/35" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-medium leading-snug",
                      sidebar ? "text-[11px]" : "text-sm",
                      item.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      "text-muted-foreground mt-0.5 leading-relaxed",
                      sidebar ? "text-[10px] line-clamp-3" : "text-xs",
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className={cn("border-t border-border space-y-1.5 bg-muted/30", sidebar ? "px-2.5 py-2" : "px-4 py-3 space-y-2")}>
            {!isPaid ? (
              <Link
                href={checkoutHref}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  sidebar ? "py-2 px-2 text-[11px]" : "rounded-xl py-3 px-4 text-sm gap-2",
                )}
              >
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", sidebar ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </Link>
            ) : allDone && liveChatUrl ? (
              <a
                href={liveChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  sidebar ? "py-2 px-2 text-[11px]" : "rounded-xl py-3 px-4 text-sm gap-2",
                )}
              >
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", sidebar ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </a>
            ) : (
              <button
                type="button"
                onClick={onContinueSetup}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                  sidebar ? "py-2 px-2 text-[11px]" : "rounded-xl py-3 px-4 text-sm gap-2",
                )}
              >
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", sidebar ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="flex w-full items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Dismiss checklist
            </button>
          </div>
        </>
      )}

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full py-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Expand checklist
        </button>
      )}
    </div>
  );
}
