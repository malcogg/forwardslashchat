"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type MobileAddSiteProps = {
  onScan: (url: string) => void;
};

const HOW_IT_WORKS = [
  "Enter your website URL and we will scan it.",
  "Choose your plan and complete checkout.",
  "We train your AI on your content.",
  "Add your domain and go live. No monthly fees.",
];

export function MobileAddSite({ onScan }: MobileAddSiteProps) {
  const [url, setUrl] = useState("");

  const handleScan = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    let toOpen = trimmed;
    if (!/^https?:\/\//i.test(toOpen)) toOpen = "https://" + toOpen;
    onScan(toOpen);
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground mt-1">
        Add a new site
      </h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Enter your website URL and we will scan it to build your AI chatbot.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          inputMode="url"
          placeholder="https://yoursite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button
          type="button"
          onClick={handleScan}
          disabled={!url.trim()}
          className="shrink-0 px-5 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          Scan
        </button>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-foreground mb-4">How it works</h2>
        <ul className="space-y-3">
          {HOW_IT_WORKS.map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </span>
              <span className="text-sm text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
