"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

const MotionPath = motion.path;
import { Search, Palette, Globe, CreditCard, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

const CARDS = [
  { step: 1, title: "Scan Your Site", description: "Enter your URL — we crawl and extract your content instantly.", icon: Search },
  { step: 2, title: "Add Your Brand", description: "We take care of the rest — AI trains on your real content.", icon: Palette },
  { step: 3, title: "Connect Domain", description: "Set chat.yourbrand.com — fully branded, seamless integration.", icon: Globe },
  { step: 4, title: "Pay Once", description: "Starting From $799 — hosting included, zero monthly fees forever.", icon: CreditCard },
  { step: 5, title: "Go Live!", description: "Deploy instantly — your AI starts answering visitors 24/7.", icon: Rocket },
] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.4 },
  }),
};

export function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.15 });

  return (
    <section id="how-it-works" className="py-24 px-6 bg-background" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Get your custom AI chatbot live in minutes to hours — no subscriptions, no hassle.
          </p>
        </div>

        {/* Card grid with connecting line behind it */}
        <div className="relative">
          {/* Connecting line: horizontal on desktop, vertical dashed on mobile; behind cards (z-0) */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
          >
            {/* Desktop: horizontal line at center, draws left-to-right on scroll */}
            <div className="hidden lg:block absolute inset-0 flex items-center">
              <svg className="w-full h-2" viewBox="0 0 100 2" preserveAspectRatio="none">
                <MotionPath
                  d="M 0 1 L 100 1"
                  stroke="#10b981"
                  strokeWidth="0.5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.6 }}
                  animate={inView ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0.6 }}
                  transition={{ pathLength: { duration: 1.2, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
                />
              </svg>
            </div>
            {/* Mobile: vertical dashed connector between stacked cards */}
            <div className="lg:hidden absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px" style={{ transformOrigin: "top" }}>
              <motion.div
                className="h-full w-px border-l-2 border-dashed border-emerald-500/60"
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ transformOrigin: "top" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 relative z-10">
            {CARDS.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  className="group bg-card rounded-xl p-6 md:p-8 border border-border shadow-sm
                    transition-all duration-300 hover:scale-[1.03] hover:shadow-md hover:shadow-emerald-500/10"
                >
                  {/* Step number in brand circle + icon */}
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {card.step}
                    </div>
                    <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground text-center mb-3">
                    {card.title}
                  </h3>
                  <p className="text-base text-muted-foreground text-center">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="cta" size="lg">
            <Link href="#scan">Scan your website</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
