"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

type MobileAccountProps = {
  displayName: string;
  email: string | undefined;
  initials: string;
  totalSites: number;
  liveSites: number;
  investedCents: number;
};

export function MobileAccount({
  displayName,
  email,
  initials,
  totalSites,
  liveSites,
  investedCents,
}: MobileAccountProps) {
  const invested = (investedCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground mt-1">Account</h1>

      {/* Profile card */}
      <div className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-lg font-semibold text-primary-foreground">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground truncate">{email || "—"}</p>
        </div>
      </div>

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
          <p className="text-xl font-bold text-foreground">{invested}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Invested</p>
        </div>
      </div>

      {/* GENERAL */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">
        General
      </h2>
      <ul className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        <li>
          <Link
            href="/user-profile"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Edit Profile</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/billing"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Billing History</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Privacy & Security</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </li>
        <li>
          <a
            href={process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Help & Support</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </a>
        </li>
      </ul>

      {/* ABOUT */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-8 mb-2">
        About
      </h2>
      <div className="rounded-xl border border-border p-4 bg-card">
        <p className="text-sm font-medium text-foreground">ForwardSlash.Chat</p>
        <p className="text-xs text-muted-foreground mt-1">
          AI chatbots for your website. One-time payment, no monthly fees.
        </p>
      </div>
    </div>
  );
}
