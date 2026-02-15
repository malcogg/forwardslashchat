"use client";

import { useState } from "react";
import { ScanModal } from "@/components/ScanModal";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const handleScan = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    // Normalize URL
    const normalized = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`;
    setUrl(normalized);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Hi, welcome.</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Enter your website URL and we&apos;ll build your AI chatbot.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="url"
            placeholder="https://yourbusiness.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            className="flex-1 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-600"
          />
          <button
            onClick={handleScan}
            className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Scan Website
          </button>
        </div>
        <p className="text-sm text-zinc-500">
          One-time payment • Your domain • Delivered in 3–10 days
        </p>
      </div>

      <ScanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={url || "https://yourbusiness.com"}
      />
    </main>
  );
}
