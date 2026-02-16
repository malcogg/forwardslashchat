"use client";

import Link from "next/link";
import { Zap, Globe, MessageSquare, Share2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/FadeInSection";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

const STRATEGY_CALL_URL = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="w-full bg-background pt-12 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInSection>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight text-balance text-foreground">
              Don&apos;t Get Left Behind in 2026
            </h1>
            <p className="font-serif text-2xl md:text-3xl mt-4 text-foreground/90">
              Supercharge your business with AI-powered websites, chatbots & social media
            </p>
            <p className="mt-6 text-muted-foreground text-lg max-w-2xl mx-auto">
              Better SEO, 24/7 customer engagement, instant leads, faster site speed. Modern design that ranks higher and converts while you&apos;re offline.
            </p>
            <Button asChild className="mt-8 rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 text-base">
              <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener noreferrer">
                Book a Strategy Call
              </a>
            </Button>
          </FadeInSection>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <FadeInSection>
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6 text-center">
              Why now?
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed">
              AI is here. Competitors are already using smart chatbots and fast modern sites to capture leads 24/7. Don&apos;t lose customers waiting for responses or to outdated designs. Get 24/7 AI responses, leads that flow directly to you, better Google rankings with a fast modern site, no more manual social posting, and automated content that grows your audience.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Our Expanded Services */}
      <section id="services" className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <FadeInSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 text-sm border border-border rounded-full mb-6 text-muted-foreground">
              Our services
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground">
              What we offer
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From AI chatbots to full website builds and social media management — we help small businesses win online.
            </p>
          </FadeInSection>

          <div className="space-y-8">
            {/* 1. Custom AI Chatbot */}
            <FadeInSection delay={50}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-serif text-2xl text-foreground">Custom AI Chatbot</h3>
                      <Link href="/" className="text-sm text-primary hover:underline shrink-0">
                        View main offering →
                      </Link>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      Train an AI on your content. Deploy at chat.yourdomain.com. One-time payment, no monthly fees.
                    </p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* 2. Brand New Website */}
            <FadeInSection delay={100}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl text-foreground">Brand New Website Build</h3>
                    <p className="mt-2 text-muted-foreground">
                      From scratch: We design, build (Next.js / Tailwind / shadcn), host on Vercel. Includes contact forms, about/services pages, blog-ready, mobile-responsive, basic SEO setup. Perfect for small businesses & startups — fast launch in days.
                    </p>
                    <p className="mt-4 text-2xl font-semibold text-foreground">$750 one-time</p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* 3. Website Redesign */}
            <FadeInSection delay={150}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl text-foreground">Website Redesign / Refresh</h3>
                    <p className="mt-2 text-muted-foreground">
                      Full modern redesign of your existing site (under 100 pages): new look/layout, better UX, speed optimizations, AI chatbot integration included, improved SEO.
                    </p>
                    <p className="mt-4 text-2xl font-semibold text-foreground">$2,000 one-time</p>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* 4. Social Media */}
            <FadeInSection delay={200}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl text-foreground">Social Media Management</h3>
                    <p className="mt-2 text-muted-foreground">
                      We set up and manage your profiles (Instagram, Facebook, X/Twitter, LinkedIn, TikTok). Create & post content — eye-catching images + short videos. Professional schedulers, engagement monitoring, basic analytics.
                    </p>
                    <div className="mt-6 grid sm:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-border p-4">
                        <p className="font-medium text-foreground">Starter</p>
                        <p className="text-2xl font-semibold text-foreground mt-1">$499<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground mt-1">3 platforms, 12-15 posts/month</p>
                      </div>
                      <div className="rounded-lg border border-primary bg-primary/5 p-4">
                        <span className="text-xs font-medium text-primary">Recommended</span>
                        <p className="font-medium text-foreground mt-1">Growth</p>
                        <p className="text-2xl font-semibold text-foreground mt-1">$899<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground mt-1">5 platforms, 20-25 posts, community replies</p>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <p className="font-medium text-foreground">Premium</p>
                        <p className="text-2xl font-semibold text-foreground mt-1">$1,499<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground mt-1">Full strategy, unlimited posts, video, ads</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>

            {/* 5. Automated Blog */}
            <FadeInSection delay={250}>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-2xl text-foreground">Automated Blog Content Engine</h3>
                    <p className="mt-2 text-muted-foreground">
                      1 high-quality, SEO-optimized blog post per day (365/year). Fully automated posting to your new/redesigned site. AI-generated but human-reviewed for tone and accuracy.
                    </p>
                    <p className="mt-4 text-2xl font-semibold text-foreground">$365/year <span className="text-sm font-normal text-muted-foreground">($1 per post)</span></p>
                  </div>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Pricing Add-ons */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <FadeInSection className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">Add-ons & extras</h2>
            <p className="mt-4 text-muted-foreground">
              Make your package complete
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="font-medium text-foreground">Free strategy call</h4>
                <p className="text-sm text-muted-foreground mt-1">30-min audit of your current site & socials</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Free</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="font-medium text-foreground">Hosting & maintenance</h4>
                <p className="text-sm text-muted-foreground mt-1">Vercel + basic updates</p>
                <p className="mt-2 text-lg font-semibold text-foreground">$49/month</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="font-medium text-foreground">Ongoing site tweaks</h4>
                <p className="text-sm text-muted-foreground mt-1">Retainer for regular updates</p>
                <p className="mt-2 text-lg font-semibold text-foreground">$99/month</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 sm:col-span-2 lg:col-span-1">
                <h4 className="font-medium text-foreground">SEO boost package</h4>
                <p className="text-sm text-muted-foreground mt-1">Keyword research, on-page optimizations</p>
                <p className="mt-2 text-lg font-semibold text-foreground">+$500 one-time</p>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-xl border border-primary/50 bg-primary/5 text-center">
              <p className="font-medium text-foreground">Bundle discount</p>
              <p className="text-sm text-muted-foreground mt-1">
                Combine any website project + AI chatbot + 3-month social minimum → <strong>15% off total</strong>
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-3xl mx-auto">
          <FadeInSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 text-sm border border-border rounded-full mb-6 text-muted-foreground">
              How it works
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Get started in 3 steps
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-medium">1</div>
                <div>
                  <h3 className="font-medium text-foreground">Book your free strategy call</h3>
                  <p className="text-muted-foreground mt-1">We audit your site and socials, then recommend a plan.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-medium">2</div>
                <div>
                  <h3 className="font-medium text-foreground">Choose your package</h3>
                  <p className="text-muted-foreground mt-1">Website, chatbot, social, blog — mix and match to fit your goals.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-sm font-medium">3</div>
                <div>
                  <h3 className="font-medium text-foreground">We deliver</h3>
                  <p className="text-muted-foreground mt-1">Fast turnaround. Deployed on Vercel. Powered by OpenAI.</p>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-12 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Powered by OpenAI · Deployed on Vercel · Built with Next.js & Tailwind
          </p>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <FadeInSection className="text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
              What clients say
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-muted-foreground italic">&ldquo;Placeholder testimonial. Real proof coming soon.&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-foreground">— Client name</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-muted-foreground italic">&ldquo;Placeholder testimonial. Real proof coming soon.&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-foreground">— Client name</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-background">
        <FadeInSection className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl mb-4 text-foreground">
            Ready to supercharge your business?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Book a free 30-minute strategy call. No obligation — just a conversation about your goals.
          </p>
          <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8">
            <a href={STRATEGY_CALL_URL} target="_blank" rel="noopener noreferrer">
              Get Your Free Quote
            </a>
          </Button>
        </FadeInSection>
      </section>

      <Footer />
    </main>
  );
}
