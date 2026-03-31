"use client";
import { useState, Suspense, useEffect, useCallback } from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { ScanModal, LAST_SCAN_KEY } from "@/components/ScanModal";

function getLastScan(): { url: string; displayUrl: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_SCAN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { url?: string; displayUrl?: string };
    if (data?.url) return { url: data.url, displayUrl: data.displayUrl ?? data.url.replace(/^https?:\/\//, "").replace(/\/$/, "") };
    return null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState("https://example.com");
  const [lastScan, setLastScan] = useState<{ url: string; displayUrl: string } | null>(null);

  const refreshLastScan = useCallback(() => setLastScan(getLastScan()), []);

  useEffect(() => {
    refreshLastScan();
  }, [refreshLastScan]);

  const handleScanClick = (url: string) => {
    setScanUrl(url);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    refreshLastScan();
  };

  const handleOpenLastScan = (url: string) => {
    setScanUrl(url);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header lastScan={lastScan} onOpenLastScan={handleOpenLastScan} />
      <HeroSection onScanClick={handleScanClick} />
      <BenefitsSection />
      <HowItWorks />
      <Suspense
        fallback={
          <section id="pricing" className="py-24 px-6 bg-slate-50 dark:bg-slate-950/50">
            <div className="max-w-2xl mx-auto text-center">
              <div className="h-10 bg-muted/50 rounded w-48 mx-auto mb-4" />
              <div className="h-5 bg-muted/30 rounded w-80 mx-auto mb-12" />
              <div className="h-64 rounded-xl bg-muted/30 border border-border" />
            </div>
          </section>
        }
      >
        <PricingSection />
      </Suspense>
      <FaqSection />
      <CtaSection />
      <Footer />

      <ScanModal
        open={modalOpen}
        onClose={handleCloseModal}
        url={scanUrl}
        onScanComplete={(url) => setScanUrl(url)}
      />
    </main>
  );
}
