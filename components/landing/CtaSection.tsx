"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/FadeInSection";

export function CtaSection() {
  return (
    <section className="py-32 px-6 bg-background">
      <FadeInSection className="max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-foreground">
          Get your AI chatbot today
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          One payment. Your domain. No monthly fees. Scan your site and see your price.
        </p>
        <Button asChild className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6">
          <a href="#scan">Scan your website</a>
        </Button>
      </FadeInSection>
    </section>
  );
}
