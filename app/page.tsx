"use client";

import { useState, useRef } from "react";
import { ScanModal } from "@/components/ScanModal";
import { InfoModal } from "@/components/InfoModal";
import { AppSidebar, SidebarToggle } from "@/components/AppSidebar";
import Link from "next/link";

type InfoModalType = "how" | "pricing" | "about" | "demo" | null;

const PILLS = [
  { id: "how" as const, label: "How it works" },
  { id: "pricing" as const, label: "Pricing" },
  { id: "about" as const, label: "About" },
  { id: "demo" as const, label: "Demo" },
];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<InfoModalType>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scannedSites, setScannedSites] = useState<string[]>([]);
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

  const handleScanComplete = (scannedUrl: string) => {
    const normalized = scannedUrl.startsWith("http") ? scannedUrl : `https://${scannedUrl}`;
    setScannedSites((prev) =>
      prev.some((s) => s.replace(/\/$/, "") === normalized.replace(/\/$/, ""))
        ? prev
        : [...prev, normalized.replace(/\/$/, "")]
    );
  };

  return (
    <div className="min-h-screen flex">
      <AppSidebar
        onScanClick={handleSidebarScan}
        scannedSites={scannedSites}
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarOpen ? "md:pl-60" : "md:pl-0"}`}>
        <div className="h-14 md:h-0" />

        {/* Top bar: sidebar toggle + deploy button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <SidebarToggle open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Dashboard
          </Link>
        </div>

        {/* Main content: greeting + pills, flex-1 to push input down */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Hello there!
            </h1>
            <p className="text-muted-foreground mb-8">
              How can I help you today?
            </p>

            {/* 4 pills in 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-12">
              {PILLS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setInfoModal(id)}
                  className="px-4 py-3 rounded-lg text-sm font-medium text-foreground bg-muted border border-border hover:bg-accent transition-colors text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input fixed at bottom */}
        <div className="sticky bottom-0 p-4 bg-background border-t border-border">
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-xl border border-input bg-muted/50 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-colors">
              <input
                ref={inputRef}
                type="url"
                placeholder="Enter your website URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="w-full px-5 py-4 pr-24 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-base"
              />
              <button
                onClick={handleScan}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Scan
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              One-time payment • Your domain • Delivered in 3–10 days
            </p>
          </div>
        </div>
      </main>

      <ScanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={url || "https://yourbusiness.com"}
        onScanComplete={handleScanComplete}
      />

      <InfoModal open={infoModal === "how"} onClose={() => setInfoModal(null)} title="How it works">
        <ol className="space-y-4 list-decimal list-inside">
          <li>
            <strong className="text-foreground">Enter your URL</strong> — We scan your site and count pages.
          </li>
          <li>
            <strong className="text-foreground">Choose what to include</strong> — Toggle products, blog, services, etc.
          </li>
          <li>
            <strong className="text-foreground">Pay once</strong> — No monthly fees. Pick a 1–5 year bundle.
          </li>
          <li>
            <strong className="text-foreground">Get your chatbot</strong> — Live at chat.yourdomain.com in 3–10 days.
          </li>
        </ol>
        <p className="mt-6 text-muted-foreground">
          Your chatbot is trained on your real content. Branded to match your site. Hosting included for your prepaid period.
        </p>
      </InfoModal>

      <InfoModal open={infoModal === "pricing"} onClose={() => setInfoModal(null)} title="Pricing">
        <p className="text-muted-foreground mb-4">
          One upfront payment. Hosting and maintenance included for your prepaid period. Renewal optional at $495/year after.
        </p>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border">
            <span>1-Year Starter</span>
            <span className="text-foreground font-medium">$550</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span>2-Year Bundle <span className="text-muted-foreground">(recommended)</span></span>
            <span className="text-foreground font-medium">$850</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span>3-Year Bundle</span>
            <span className="text-foreground font-medium">$1,250</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span>4-Year Bundle</span>
            <span className="text-foreground font-medium">$1,600</span>
          </div>
          <div className="flex justify-between py-2">
            <span>5-Year Bundle</span>
            <span className="text-foreground font-medium">$1,950</span>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground">
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
        <p className="text-muted-foreground">
          Delivery in 3–10 business days. Hosting included. You own your subdomain (chat.yourdomain.com). Renewal is optional after your prepaid period.
        </p>
      </InfoModal>

      <InfoModal open={infoModal === "demo"} onClose={() => setInfoModal(null)} title="Demo">
        <p className="mb-4">
          Try our demo chatbot to see how it works. It&apos;s trained on sample content (products, blog, etc.) so you can experience the flow before scanning your own site.
        </p>
        <Link
          href="/chat/demo"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Open Demo Chat
        </Link>
      </InfoModal>
    </div>
  );
}
