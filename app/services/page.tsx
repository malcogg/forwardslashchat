"use client";

import Link from "next/link";
import {
  LayoutTemplate,
  Smartphone,
  MessageSquare,
  Search,
  Settings,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeInSection } from "@/components/FadeInSection";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const CHECKOUT_BASE = "/checkout";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="w-full bg-background pt-12 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance text-foreground">
              Modern Website + Built-in AI Chatbot for Your Business
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              New build, redesign, or quick start — get online fast with professional design and 24/7 AI help. One-time payment, no monthly fees.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 text-base"
            >
              <Link href="/services#pricing">
                Get started
              </Link>
            </Button>
            <p className="mt-6 text-sm text-muted-foreground">
              Florida-focused · Secure · Delivered fast
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-slate-50 dark:bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <FadeInSection className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              One-time payment. Year 1 hosting included. No monthly fees.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Quick Starter - highlighted */}
            <FadeInSection delay={50}>
              <div className="relative rounded-xl border-2 border-emerald-500/50 bg-card p-6 shadow-lg shadow-emerald-500/5 flex flex-col">
                <Badge variant="success" className="absolute -top-2.5 left-6">
                  Just Get Started
                </Badge>
                <h3 className="font-serif text-2xl text-foreground mt-2">
                  Quick WordPress Starter
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  $350 <span className="text-sm font-normal text-muted-foreground">one-time</span>
                </p>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    10 clean pages (Home, About, Services, Contact, etc.)
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    WordPress — easy to update yourself
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    Basic SEO + fast loading
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    Contact form + Google Maps
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    Year 1 hosting included
                  </li>
                </ul>
                <Button
                  asChild
                  className="mt-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Link href={`${CHECKOUT_BASE}?plan=starter`}>Get Your $350 Site Now</Link>
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Perfect if you just want a simple site to get going
                </p>
              </div>
            </FadeInSection>

            {/* Brand New Build */}
            <FadeInSection delay={100}>
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
                <h3 className="font-serif text-2xl text-foreground">
                  Brand New Website Build
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  $1,000 <span className="text-sm font-normal text-muted-foreground">one-time</span>
                </p>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Full custom site + AI Chatbot included
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Modern, mobile-responsive (Next.js or WordPress)
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Fast loading + basic/advanced SEO
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Contact forms, Google Maps, service pages, blog-ready
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    We build + host year 1
                  </li>
                </ul>
                <Button asChild variant="outline" className="mt-6 rounded-full">
                  <Link href={`${CHECKOUT_BASE}?plan=new-build`}>Select $1,000 Build</Link>
                </Button>
              </div>
            </FadeInSection>

            {/* Redesign */}
            <FadeInSection delay={150}>
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
                <h3 className="font-serif text-2xl text-foreground">
                  Website Redesign / Refresh
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  $2,000 <span className="text-sm font-normal text-muted-foreground">one-time</span>
                </p>
                <ul className="mt-6 space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Upgrade your existing site + AI Chatbot
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Speed & SEO upgrades
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Modern design, mobile-responsive
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    Contact forms, Maps, service pages
                  </li>
                  <li className="flex gap-2">
                    <ChevronRight className="w-4 h-4 shrink-0 text-sky-600" />
                    We build + host year 1
                  </li>
                </ul>
                <Button asChild variant="outline" className="mt-6 rounded-full">
                  <Link href={`${CHECKOUT_BASE}?plan=redesign`}>Select $2,000 Redesign</Link>
                </Button>
              </div>
            </FadeInSection>
          </div>

          <FadeInSection delay={200} className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include year 1 hosting. After that: move free (we give full access) or renew hosting for $200/year (optional).
            </p>
            <p className="mt-4 text-base font-medium text-foreground">
              Just want a simple site to get started?{" "}
              <Link href={`${CHECKOUT_BASE}?plan=starter`} className="text-emerald-600 hover:underline">
                $350 one-time →
              </Link>
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <FadeInSection className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              What You Get
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Professional websites built for Florida entrepreneurs and local businesses.
            </p>
          </FadeInSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: LayoutTemplate,
                title: "Professional modern look that converts",
              },
              {
                icon: Smartphone,
                title: "Mobile responsive + fast loading",
              },
              {
                icon: MessageSquare,
                title: "Built-in AI Chatbot answers 24/7",
              },
              {
                icon: Search,
                title: "Basic/advanced SEO to rank better in Florida",
              },
              {
                icon: Settings,
                title: "Easy to update (WordPress or dashboard)",
              },
              {
                icon: Rocket,
                title: "We build + host year 1 — you focus on business",
              },
            ].map((item, i) => (
              <FadeInSection key={item.title} delay={50 * i}>
                <div className="rounded-xl border border-border bg-card p-6">
                  <item.icon className="w-10 h-10 text-emerald-600 mb-4" />
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50 dark:bg-slate-950/50">
        <div className="max-w-3xl mx-auto">
          <FadeInSection className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              How It Works
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-lg font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Tell us your business & goals</h3>
                  <p className="text-muted-foreground mt-1">
                    Share your industry, what you do, and what you want your site to achieve.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-lg font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-foreground">We design & build (with AI chatbot)</h3>
                  <p className="text-muted-foreground mt-1">
                    We create your site, train the AI on your content, and prepare everything for launch.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-lg font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Launch + host — live in days/weeks</h3>
                  <p className="text-muted-foreground mt-1">
                    Your site goes live. We host it year 1. You get full access whenever you want to move.
                  </p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <FadeInSection className="text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground">
              Who It&apos;s For
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed text-lg">
              New entrepreneurs and local pros in Florida — plumbers, shops, restaurants, contractors, startups — needing a clean online presence fast. From a quick $350 starter site to a full custom build with AI chatbot.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950/50">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            Ready to Get Online?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start with a $350 quick site or choose a full custom build. One-time payment, no monthly fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              <Link href={`${CHECKOUT_BASE}?plan=starter`}>
                Start with $350 Quick Site
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8">
              <Link href="#pricing">Or choose a higher plan</Link>
            </Button>
          </div>
        </FadeInSection>
      </section>

      <Footer />
    </main>
  );
}
