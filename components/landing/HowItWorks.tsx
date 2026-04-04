"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Search, Brain, Globe, CreditCard, Rocket } from "lucide-react";

const MotionPath = motion.path;
import { Button } from "@/components/ui/button";

/** Matches the real product: scan → train → DNS → Stripe checkout → auto deploy. */
const CARDS = [
  {
    step: 1,
    title: "Scan your site",
    description: "Paste your URL — we crawl public pages and map what your AI can learn from.",
    icon: Search,
  },
  {
    step: 2,
    title: "Train on your content",
    description: "We build a private knowledge base from your site copy so answers stay on-brand.",
    icon: Brain,
  },
  {
    step: 3,
    title: "Connect your domain",
    description: "Point DNS once — your assistant lives at chat.yourdomain.com (we guide you).",
    icon: Globe,
  },
  {
    step: 4,
    title: "Pay once",
    description: "Plans from $129 (Starter) up — hosting included, no monthly platform fees.",
    icon: CreditCard,
  },
  {
    step: 5,
    title: "Go live",
    description: "Your AI answers visitors 24/7 on your branded chat URL.",
    icon: Rocket,
  },
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
    <section id="how-it-works" className="py-24 px-6 bg-muted/30 dark:bg-muted/10" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400/90 mb-3">
            From URL to live chat
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            How it really works
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            When you already have a website, this is the path: scan, train, connect DNS, pay once, and your chatbot goes
            live. No website yet?{" "}
            <Link href="/services" className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline underline-offset-4">
              See website + AI packages
            </Link>
            .
          </p>
        </div>

        {/* Card grid: line runs at badge height, badges overlap card tops */}
        <div className="relative pt-6">
          {/* Desktop: horizontal line through badge centers — behind cards, z-0 */}
          <div className="hidden lg:block absolute left-0 right-0 top-6 h-px pointer-events-none" aria-hidden>
            <svg className="w-full h-2 -translate-y-1/2" viewBox="0 0 100 2" preserveAspectRatio="none">
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
          {/* Mobile: vertical dashed connector */}
          <div className="lg:hidden absolute left-1/2 top-6 bottom-0 -translate-x-1/2 w-px pointer-events-none" aria-hidden style={{ transformOrigin: "top" }}>
            <motion.div
              className="h-full w-px border-l-2 border-dashed border-emerald-500/60"
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              style={{ transformOrigin: "top" }}
            />
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
                  className={`group relative rounded-xl pt-12 pb-6 px-6 md:pt-14 md:pb-8 md:px-8 border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:shadow-emerald-500/10 ${
                    index === CARDS.length - 1
                      ? "bg-card border-emerald-500/30 ring-1 ring-emerald-500/20"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Badge: overlaps top of card, center aligns with connecting line */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0 ring-4 ring-background">
                    {card.step}
                  </div>
                  <div
                    className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                      index === CARDS.length - 1
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                        : "bg-background text-emerald-800 dark:text-emerald-400 border border-border/80 shadow-sm"
                    }`}
                  >
                    <Icon className="w-7 h-7" strokeWidth={index === CARDS.length - 1 ? 2.25 : 2} />
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

        <div className="mt-12 text-center space-y-3">
          <Button asChild variant="cta" size="lg" className="rounded-full px-8">
            <Link href="#scan">Scan your website</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Starting in minutes — finish checkout when you&apos;re ready.
          </p>
        </div>
      </div>
    </section>
  );
}
