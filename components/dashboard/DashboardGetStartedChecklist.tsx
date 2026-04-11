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
  checkoutHref: string;
  unpaidQuoteDollars: number | null;
  isPaid: boolean;
  liveChatUrl: string | null;
  onContinueSetup: () => void;
  /** sidebar: nav column; main: under next-step in work area; floating: fixed bottom-left */
  layout?: "sidebar" | "main" | "floating";
};

export function DashboardGetStartedChecklist({
  orderId,
  items,
  checkoutHref,
  unpaidQuoteDollars,
  isPaid,
  liveChatUrl,
  onContinueSetup,
  layout = "main",
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const [expanded, setExpanded] = useState(layout !== "sidebar");
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

  const compact = layout === "sidebar";
  const mainCol = layout === "main";
  const ringSize = compact ? "h-8 w-8" : mainCol ? "h-9 w-9" : "h-10 w-10";
  const iconTile = compact ? "h-8 w-8" : mainCol ? "h-9 w-9" : "h-10 w-10";

  const ctaClass = cn(
    "flex w-full items-center justify-center font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-background",
    "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    compact ? "gap-1.5 rounded-lg py-2 px-2 text-[11px]" : mainCol ? "gap-2 rounded-lg py-2.5 px-3 text-xs" : "gap-2 rounded-xl py-3 px-4 text-sm",
  );

  return (
    <div
      className={cn(
        "overflow-y-auto overscroll-contain rounded-xl border border-border bg-card text-card-foreground",
        compact &&
          "relative z-0 mt-3 w-full max-h-[min(48vh,360px)] shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        mainCol &&
          "relative z-0 mt-2 w-full max-h-[min(46vh,400px)] shadow-sm ring-1 ring-emerald-500/15 dark:ring-emerald-500/20",
        layout === "floating" &&
          "hidden md:block fixed z-50 w-[min(calc(100vw-1.5rem),380px)] max-h-[min(72dvh,540px)] rounded-2xl shadow-2xl ring-1 ring-emerald-500/20 dark:ring-emerald-500/25 left-4 right-auto bottom-[max(1rem,env(safe-area-inset-bottom,0px))] md:left-6 md:bottom-6",
      )}
      role="region"
      aria-label="Get started checklist"
    >
      <div
        className={cn(
          "border-b border-border flex items-start gap-2",
          compact ? "px-2.5 py-2" : mainCol ? "px-3 py-2.5 gap-3" : "px-4 py-3 gap-3",
        )}
      >
        <div
          className={cn(
            "rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shrink-0 shadow-md",
            iconTile,
          )}
        >
          <ListChecks
            className={cn("text-white", compact ? "h-4 w-4" : mainCol ? "h-[18px] w-[18px]" : "h-5 w-5")}
            strokeWidth={2}
          />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className={cn("font-semibold text-foreground leading-tight", compact ? "text-xs" : mainCol ? "text-sm" : "text-sm")}>
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
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
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
          <ul className={cn("space-y-2", compact ? "px-2.5 py-2" : mainCol ? "px-3 py-2 space-y-2.5" : "px-4 py-3 space-y-3")}
          >
            {items.map((item) => (
              <li key={item.id} className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                  {item.done ? (
                    <Check className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/40 dark:bg-emerald-400/40" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-medium leading-snug",
                      compact ? "text-[11px]" : "text-sm",
                      item.done ? "text-muted-foreground line-through" : "text-foreground",
                    )}
                  >
                    {item.title}
                  </p>
                  <p
                    className={cn(
                      "text-muted-foreground mt-0.5 leading-relaxed",
                      compact ? "text-[10px] line-clamp-3" : "text-xs",
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "border-t border-emerald-500/15 space-y-1.5 bg-emerald-500/[0.06] dark:bg-emerald-500/10",
              compact ? "px-2.5 py-2" : mainCol ? "px-3 py-2.5 space-y-2" : "px-4 py-3 space-y-2",
            )}
          >
            {!isPaid ? (
              <Link href={checkoutHref} className={ctaClass}>
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </Link>
            ) : allDone && liveChatUrl ? (
              <a href={liveChatUrl} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </a>
            ) : (
              <button type="button" onClick={onContinueSetup} className={ctaClass}>
                <span className="text-center leading-snug">{primaryLabel}</span>
                <ArrowRight className={cn("shrink-0 opacity-90", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="flex w-full items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
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
          className="w-full py-2.5 text-xs text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          Expand checklist
        </button>
      )}
    </div>
  );
}
