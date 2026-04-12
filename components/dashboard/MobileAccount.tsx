"use client";

import Link from "next/link";
import { ChevronRight, CreditCard, Sparkles } from "lucide-react";

type MobileAccountProps = {
  displayName: string;
  email: string | undefined;
  initials: string;
  totalSites: number;
  liveSites: number;
  /** Sum of order amounts (cents) — shown as amount paid */
  totalPaidCents: number;
  onOpenBundles: () => void;
  onReplayOnboarding: () => void;
};

export function MobileAccount({
  displayName,
  email,
  initials,
  totalSites,
  liveSites,
  totalPaidCents,
  onOpenBundles,
  onReplayOnboarding,
}: MobileAccountProps) {
  const amountPaid = (totalPaidCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground mt-1">Account</h1>

      {/* Profile card */}
      <Link
        href="/user-profile"
        className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted/70 transition-colors"
      >
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-lg font-semibold text-primary-foreground">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">{email || "—"}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Edit profile & security →</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
          <p className="text-xl font-bold text-foreground">{totalSites}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sites</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
          <p className="text-xl font-bold text-foreground">{liveSites}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Live</p>
        </div>
        <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
          <p className="text-xl font-bold text-foreground">{amountPaid}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Amount paid</p>
        </div>
      </div>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">Your account</h2>
      <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        <li>
          <Link
            href="/user-profile"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Name, email & security</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/billing"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Billing & order history</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={onOpenBundles}
            className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Bundles & checkout
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </li>
      </ul>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">Support</h2>
      <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        <li>
          <button
            type="button"
            onClick={onReplayOnboarding}
            className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              Replay welcome tour
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        </li>
        <li>
          <a
            href={process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Help & support</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>
        </li>
      </ul>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">Legal</h2>
      <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        <li>
          <Link
            href="/terms"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Terms of service</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Privacy policy</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            href="/services"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Services & pricing</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
      </ul>

      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">About</h2>
      <div className="rounded-xl border border-border p-4 bg-card space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">ForwardSlash.Chat</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI chatbots for your website. One-time payment, no monthly fees.
          </p>
        </div>
        <Link href="/" className="inline-block text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
          Visit marketing site →
        </Link>
      </div>
    </div>
  );
}
