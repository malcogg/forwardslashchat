"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Search, Brain, Globe, CreditCard, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";

const MotionPath = motion.path;

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
            <Link
              href="/services"
              className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline underline-offset-4"
            >
              See website + AI packages
            </Link>
            .
          </p>
        </div>

        {/* Desktop: badges row, then cards row — horizontal line sits behind cards, vertically centered on card bodies */}
        <div className="relative">
          <div className="hidden lg:block">
            <div className="grid grid-cols-5 gap-6 md:gap-8 relative z-20">
              {CARDS.map((card) => (
                <div key={`badge-${card.step}`} className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-600/30 ring-4 ring-muted/30 dark:ring-background/80">
                    {card.step}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative -mt-6 pt-8 pb-2">
              {/* Single SVG: soft track behind + draw-on-scroll stroke (matches emerald CTA family) */}
              <motion.div
                className="pointer-events-none absolute left-[5%] right-[5%] top-1/2 z-0 h-[4px] -translate-y-1/2"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <svg className="h-full w-full" viewBox="0 0 100 4" preserveAspectRatio="none">
                  <path
                    d="M 0 2 L 100 2"
                    stroke="rgb(16 185 129)"
                    strokeOpacity={0.22}
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <MotionPath
                    d="M 0 2 L 100 2"
                    stroke="rgb(5 150 105)"
                    strokeOpacity={0.65}
                    strokeWidth="0.55"
                    fill="none"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ pathLength: { duration: 1.2, ease: "easeInOut" } }}
                  />
                </svg>
              </motion.div>

              <div className="relative z-10 grid grid-cols-5 gap-6 md:gap-8">
                {CARDS.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate={inView ? "visible" : "hidden"}
                      className={`group relative rounded-xl pt-6 pb-6 px-6 md:pb-8 md:px-8 border shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                        index === CARDS.length - 1
                          ? "bg-card border-emerald-500/35 ring-1 ring-emerald-500/25 shadow-emerald-500/10"
                          : "bg-card border-border/90 shadow-black/5 dark:shadow-none"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                          index === CARDS.length - 1
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                            : "bg-background text-emerald-800 dark:text-emerald-400 border border-emerald-500/15 shadow-sm"
                        }`}
                      >
                        <Icon className="w-7 h-7" strokeWidth={index === CARDS.length - 1 ? 2.25 : 2} />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground text-center mb-3">{card.title}</h3>
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">{card.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile / tablet: stacked cards + vertical connector */}
          <div className="lg:hidden relative pt-2">
            {/* Single-column only: subtle vertical guide */}
            <div className="max-sm:block hidden absolute left-1/2 top-8 bottom-8 w-px -translate-x-1/2 pointer-events-none z-0" aria-hidden>
              <motion.div
                className="h-full w-px bg-gradient-to-b from-emerald-500/15 via-emerald-500/35 to-emerald-500/15"
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 1, delay: 0.15 }}
                style={{ transformOrigin: "top" }}
              />
            </div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {CARDS.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className={`group relative rounded-xl pt-10 pb-6 px-6 border shadow-sm ${
                      index === CARDS.length - 1
                        ? "bg-card border-emerald-500/30 ring-1 ring-emerald-500/15"
                        : "bg-card border-border"
                    }`}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-base font-bold ring-4 ring-muted/30 dark:ring-background/80">
                      {card.step}
                    </div>
                    <div
                      className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                        index === CARDS.length - 1
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-muted/50 text-emerald-800 dark:text-emerald-400 border border-border/80"
                      }`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground text-center mb-2">{card.title}</h3>
                    <p className="text-sm text-muted-foreground text-center leading-relaxed">{card.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-14 text-center space-y-4">
          <Button
            asChild
            variant="cta"
            size="lg"
            className="rounded-full px-10 py-6 text-base font-semibold shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/35 ring-2 ring-emerald-500/20"
          >
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
