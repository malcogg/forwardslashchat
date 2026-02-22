"use client";

import Link from "next/link";

export function AnnouncementBanner() {
  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 text-center text-sm text-foreground">
      <span className="font-medium">Limited time only</span>
      {" — "}
      <span>Starter Bot for $129</span>
      {" — "}
      AI chatbot for very small sites (up to 5 pages), 1 year included.
      {" "}
      <Link
        href="/checkout?plan=starter-bot"
        className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
      >
        Get yours now →
      </Link>
    </div>
  );
}
