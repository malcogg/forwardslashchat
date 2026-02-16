"use client";

import { FileText, Globe, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/FadeInSection";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <FadeInSection className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-sm border border-border rounded-full mb-6 text-muted-foreground">
            How it works
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-balance text-foreground">
            The easiest way to
            <br />
            get your AI chatbot
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Scan your site, pay once, add your brand. We train your AI and deploy it at your subdomain — no monthly fees.
          </p>
        </FadeInSection>

        <FadeInSection>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">1. Scan your site</h3>
            <p className="text-muted-foreground leading-relaxed">
              Enter your URL. We crawl your pages and extract your content — services, FAQ, products, blog. Pick your
              tier based on page count.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <ScanCard />
          </div>
        </div>
        </FadeInSection>

        <FadeInSection delay={100}>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <BrandCard />
          </div>
          <div>
            <h3 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">2. Add your brand</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload your logo and favicon, adjust colors. Make your AI chat reflect your existing brand and voice —
              fully branded and professional.
            </p>
          </div>
        </div>
        </FadeInSection>

        <FadeInSection delay={100}>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">3. Connect a custom domain</h3>
            <p className="text-muted-foreground leading-relaxed">
              Add your own subdomain or path. Your AI chat will live at chat.mybusiness.com or mybusiness.com/chat —
              a seamless part of your brand, not a third-party widget.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <DomainCard />
          </div>
        </div>
        </FadeInSection>

        <FadeInSection delay={100}>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <PaymentsCard />
          </div>
          <div>
            <h3 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">4. Pay once</h3>
            <p className="text-muted-foreground leading-relaxed">
              Choose a 1–3 year bundle. One payment covers creation, hosting, and maintenance. No monthly fees or
              per-message charges.
            </p>
          </div>
        </div>
        </FadeInSection>

        <FadeInSection delay={100}>
        <div className="text-center mb-16">
          <h3 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">5. Go live!</h3>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Your branded AI chatbot is ready. Add a CNAME record and it goes live at your domain in minutes.
          </p>
          <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6">
            <a href="#scan">Scan your website</a>
          </Button>
        </div>
        </FadeInSection>

        <FadeInSection delay={150}>
        <ChatDemo />
        </FadeInSection>
      </div>
    </section>
  );
}

function ScanCard() {
  return (
    <div className="bg-dot-grid-card rounded-xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
        <h4 className="text-sm font-medium mb-4 text-foreground">Scan results</h4>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Page count</label>
            <div className="h-0.5 bg-muted mt-2 w-full" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Categories found</label>
            <div className="h-0.5 bg-muted mt-2 w-full" />
          </div>
        </div>

        <h4 className="text-sm font-medium mt-6 mb-3 text-foreground">Files & pages</h4>
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">Services, FAQ, Blog...</span>
        </div>

        <h4 className="text-sm font-medium mt-6 mb-3 text-foreground">Website</h4>
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">mywebsite.com</span>
        </div>
      </div>
    </div>
  );
}

function BrandCard() {
  return (
    <div className="bg-dot-grid-card rounded-xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <span className="text-foreground font-bold">A</span>
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Upload className="w-4 h-4" />
            Upload logo
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Background</span>
            <div className="w-8 h-8 rounded-full bg-muted border border-border" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Accent</span>
            <div className="w-8 h-8 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainCard() {
  return (
    <div className="bg-dot-grid-card rounded-xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border space-y-3">
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground">chat.mybusiness.com</span>
        </div>
        <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground">mybusiness.com/chat</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs">✓</span>
          </div>
          <span className="text-sm text-green-600 dark:text-green-400">Domain connected</span>
        </div>
      </div>
    </div>
  );
}

function PaymentsCard() {
  return (
    <div className="bg-dot-grid-card rounded-xl p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
      <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <span className="text-primary font-bold text-xl">One-time payment</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-foreground">1-Year Starter</span>
            <span className="text-sm font-medium text-foreground">$550</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-foreground">2-Year Bundle</span>
            <span className="text-sm font-medium text-foreground">$850</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">5-Year Bundle</span>
            <span className="text-sm font-medium text-foreground">$1,950</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">Hosting included • No monthly fees</p>
      </div>
    </div>
  );
}

function ChatDemo() {
  return (
    <div className="rounded-3xl p-8 bg-dot-grid-card border border-border shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)]">
      <div className="max-w-2xl mx-auto bg-card rounded-xl shadow-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-foreground text-xs font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-foreground">Your Business</span>
          </div>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Chat</span>
            <span className="text-sm text-muted-foreground">About</span>
            <span className="text-sm text-muted-foreground">Pricing</span>
            <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-full">Sign up</button>
          </nav>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-foreground">How can I help?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ask me about your services, products,
            <br />
            or anything on your website.
          </p>

          <div className="max-w-md mx-auto mb-6">
            <div className="border border-input rounded-lg p-3">
              <input
                type="text"
                placeholder="Ask anything"
                className="w-full text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>📎</span> 0 Files
                </div>
                <button className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">↑</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-left max-w-md mx-auto space-y-2">
            <p className="text-sm text-muted-foreground">What services do you offer?</p>
            <p className="text-sm text-muted-foreground">Tell me about your products</p>
            <p className="text-sm text-muted-foreground">How do I get in touch?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
