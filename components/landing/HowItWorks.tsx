"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const CARDS = [
  {
    title: "1. Scan Your Site",
    description: "Enter your URL — we crawl and extract your content instantly.",
  },
  {
    title: "2. Add Your Brand",
    description: "Upload logo, colors & voice — AI trains on your real content.",
  },
  {
    title: "3. Connect Domain",
    description: "Set chat.yourbrand.com — fully branded, seamless integration.",
  },
  {
    title: "4. Pay Once",
    description: "From $379 — hosting included, zero monthly fees forever.",
  },
  {
    title: "5. Go Live!",
    description: "Deploy instantly — your AI starts answering visitors 24/7.",
  },
] as const;

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll(".how-it-works-card");
    if (!cards?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (index >= 0) {
              setVisibleCards((prev) => new Set(prev).add(index));
            }
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-24 px-6 bg-background" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Get your custom AI chatbot live in minutes — no subscriptions, no hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {CARDS.map((card, index) => (
            <div
              key={card.title}
              data-index={index}
              className={`how-it-works-card bg-card rounded-xl p-6 border border-border shadow-sm transition-all duration-500 hover:scale-[1.05] hover:shadow-xl hover:border-muted-foreground/30 ${
                visibleCards.has(index) ? "how-it-works-card-visible" : "how-it-works-card-hidden"
              }`}
              style={{ transitionDelay: visibleCards.has(index) ? `${index * 80}ms` : "0ms" }}
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center text-3xl text-muted-foreground">
                Icon
              </div>
              <h3 className="text-2xl font-semibold text-foreground text-center mb-3">
                {card.title}
              </h3>
              <p className="text-base text-muted-foreground text-center">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="#scan"
            className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Scan your website
          </Link>
        </div>
      </div>
    </section>
  );
}
