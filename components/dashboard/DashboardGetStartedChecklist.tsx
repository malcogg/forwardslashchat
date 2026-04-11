"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ListChecks, X, ArrowRight } from "lucide-react";

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
};

export function DashboardGetStartedChecklist({
  orderId,
  items,
  checkoutHref,
  unpaidQuoteDollars,
  isPaid,
  liveChatUrl,
  onContinueSetup,
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const [expanded, setExpanded] = useState(true);
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

  return (
    <div
      className="fixed z-50 left-1/2 top-1/2 w-[min(calc(100vw-1.5rem),380px)] max-h-[85dvh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain shadow-2xl rounded-2xl border border-white/10 bg-[#141414] text-zinc-100"
      role="region"
      aria-label="Get started checklist"
    >
      <div className="border-b border-white/10 px-4 py-3 flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg">
          <ListChecks className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-white leading-tight">Get started checklist</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {completed} of {total} complete
          </p>
        </div>
        <div className="relative h-10 w-10 shrink-0" aria-hidden>
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
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
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
            {completed}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 shrink-0"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse checklist" : "Expand checklist"}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <>
          <ul className="px-4 py-3 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-900">
                  {item.done ? (
                    <span className="text-[10px] text-white font-bold">✓</span>
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug ${
                      item.done ? "text-zinc-500 line-through" : "text-white"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/10 px-4 py-3 space-y-2 bg-black/30">
            {!isPaid ? (
              <Link
                href={checkoutHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-zinc-900 py-3 px-4 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Link>
            ) : allDone && liveChatUrl ? (
              <a
                href={liveChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-zinc-900 py-3 px-4 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4 opacity-80" />
              </a>
            ) : (
              <button
                type="button"
                onClick={onContinueSetup}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-zinc-900 py-3 px-4 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4 opacity-80" />
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="flex w-full items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss this checklist
            </button>
          </div>
        </>
      )}

      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Tap to expand checklist
        </button>
      )}
    </div>
  );
}
