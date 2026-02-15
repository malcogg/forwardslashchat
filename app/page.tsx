"use client";

import { useState, useRef } from "react";
import { ScanModal } from "@/components/ScanModal";
import { InfoModal } from "@/components/InfoModal";
import { AppSidebar } from "@/components/AppSidebar";
import Link from "next/link";

type InfoModalType = "how" | "pricing" | "about" | "demo" | null;

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<InfoModalType>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    setUrl(normalized);
    setModalOpen(true);
  };

  const handleSidebarScan = () => {
    if (url.trim()) {
      handleScan();
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar onScanClick={handleSidebarScan} onInfoClick={(id) => setInfoModal(id)} />

      {/* Main content - offset for desktop sidebar */}
      <main className="flex-1 flex flex-col md:pl-60 min-h-screen">
        {/* Mobile top spacer */}
        <div className="h-14 md:h-0" />

        {/* Hero + Input - ai-chatbot style */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mb-3">
            AI chatbot for your website
          </h1>
          <p className="text-zinc-400 text-center mb-10 max-w-xl mx-auto">
            Enter your website URL. We&apos;ll scan it and build a custom chatbot. One-time payment, no monthly fees.
          </p>

          {/* Chat-style input */}
          <div className="relative rounded-xl border border-zinc-700 bg-zinc-900/50 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-colors">
            <input
              ref={inputRef}
              type="url"
              placeholder="Enter your website URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="w-full px-5 py-4 pr-32 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
            />
            <button
              onClick={handleScan}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors text-sm"
            >
              Scan
            </button>
          </div>

          <p className="text-xs text-zinc-500 text-center mt-4">
            One-time payment • Your domain • Delivered in 3–10 days
          </p>

          {/* Compact pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {[
              { id: "how" as const, label: "How it works" },
              { id: "pricing" as const, label: "Pricing" },
              { id: "about" as const, label: "About" },
              { id: "demo" as const, label: "Demo" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setInfoModal(id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ScanModal open={modalOpen} onClose={() => setModalOpen(false)} url={url || "https://yourbusiness.com"} />

      <InfoModal open={infoModal === "how"} onClose={() => setInfoModal(null)} title="How it works">
        <ol className="space-y-4 list-decimal list-inside">
          <li>
            <strong className="text-white">Enter your URL</strong> — We scan your site and count pages.
          </li>
          <li>
            <strong className="text-white">Choose what to include</strong> — Toggle products, blog, services, etc.
          </li>
          <li>
            <strong className="text-white">Pay once</strong> — No monthly fees. Pick a 1–5 year bundle.
          </li>
          <li>
            <strong className="text-white">Get your chatbot</strong> — Live at chat.yourdomain.com in 3–10 days.
          </li>
        </ol>
        <p className="mt-6 text-zinc-500">
          Your chatbot is trained on your real content. Branded to match your site. Hosting included for your prepaid period.
        </p>
      </InfoModal>

      <InfoModal open={infoModal === "pricing"} onClose={() => setInfoModal(null)} title="Pricing">
        <p className="text-zinc-400 mb-4">
          One upfront payment. Hosting and maintenance included for your prepaid period. Renewal optional at $495/year after.
        </p>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span>1-Year Starter</span>
            <span className="text-white font-medium">$550</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span>2-Year Bundle <span className="text-zinc-500">(recommended)</span></span>
            <span className="text-white font-medium">$850</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span>3-Year Bundle</span>
            <span className="text-white font-medium">$1,250</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span>4-Year Bundle</span>
            <span className="text-white font-medium">$1,600</span>
          </div>
          <div className="flex justify-between py-2">
            <span>5-Year Bundle</span>
            <span className="text-white font-medium">$1,950</span>
          </div>
        </div>
        <p className="mt-4 text-zinc-500">
          +$99 optional: Help with DNS setup. Scan your site to see your recommended tier based on page count.
        </p>
      </InfoModal>

      <InfoModal open={infoModal === "about"} onClose={() => setInfoModal(null)} title="About">
        <p className="mb-4">
          ForwardSlash.Chat builds custom AI chatbots for small and medium businesses. Pay once, get a chatbot trained on your website that lives at your subdomain—no monthly fees.
        </p>
        <p className="mb-4">
          We use your real content—services, FAQ, products, blog—so visitors get accurate answers. The chatbot is branded with your colors and logo.
        </p>
        <p className="text-zinc-500">
          Delivery in 3–10 business days. Hosting included. You own your subdomain (chat.yourdomain.com). Renewal is optional after your prepaid period.
        </p>
      </InfoModal>

      <InfoModal open={infoModal === "demo"} onClose={() => setInfoModal(null)} title="Demo">
        <p className="mb-4">
          Try our demo chatbot to see how it works. It&apos;s trained on sample content so you can experience the flow before scanning your own site.
        </p>
        <Link
          href="/chat/demo"
          className="inline-block px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Open Demo Chat
        </Link>
      </InfoModal>
    </div>
  );
}
