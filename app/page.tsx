"use client";
// Landing page - ForwardSlash
import { useState } from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";
import { ScanModal } from "@/components/ScanModal";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [scanUrl, setScanUrl] = useState("https://example.com"); // Deployment triggered

  const handleScanClick = (url: string) => {
    setScanUrl(url);
    setModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection onScanClick={handleScanClick} />
      <HowItWorks />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <Footer />

      <ScanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        url={scanUrl}
        onScanComplete={(url) => setScanUrl(url)}
      />
    </main>
  );
}
