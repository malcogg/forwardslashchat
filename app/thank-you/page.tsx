"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Check, Calendar } from "lucide-react";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

const WEBSITE_PLAN_SLUGS = new Set(["starter", "new-build", "redesign"]);

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const planSlug = searchParams.get("plan") ?? "";
  const isWebsiteOrder = WEBSITE_PLAN_SLUGS.has(planSlug);

  const signUpUrl = orderId
    ? `/sign-up?redirect_url=${encodeURIComponent(`/dashboard?orderId=${orderId}`)}`
    : "/sign-up?redirect_url=%2Fdashboard";
  const signInUrl = orderId
    ? `/sign-in?redirect_url=${encodeURIComponent(`/dashboard?orderId=${orderId}`)}`
    : "/sign-in?redirect_url=%2Fdashboard";

  return (
    <section className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
            Thanks for your order!
          </h1>
          {isWebsiteOrder ? (
            <p className="text-muted-foreground mb-8">
              We&apos;ve received your payment for your <strong className="text-foreground font-medium">website project</strong>.
              Our team will email you shortly to kick things off. (Our fully automated{" "}
              <strong className="text-foreground font-medium">AI chatbot</strong> is a separate purchase—train on your content and
              go live at chat.yourdomain.com.)
            </p>
          ) : (
            <p className="text-muted-foreground mb-8">
              We&apos;re training your AI chatbot on your site automatically. Most crawls finish within{" "}
              <strong className="text-foreground font-medium">about 5–15 minutes</strong> (larger sites can take longer). Watch the{" "}
              <strong className="text-foreground font-medium">Training</strong> section on your dashboard for live status, and check your inbox—we email you when content is ready and when it&apos;s time to add DNS.
            </p>
          )}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">
              Create an account to track your order and get updates.
            </p>
            <p className="text-xs text-muted-foreground">
              {isWebsiteOrder
                ? "Your dashboard shows this website order; we&apos;ll coordinate the build by email."
                : "You&apos;ll see automation status (crawl, DNS, go-live), in-dashboard messages, and the same steps we email you about."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={signUpUrl}
                className="flex-1 px-4 py-3 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-center"
              >
                Create account
              </Link>
              <Link
                href={signInUrl}
                className="flex-1 px-4 py-3 rounded-full border border-border font-medium hover:bg-muted transition-colors text-center"
              >
                Sign in
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Already signed in?{" "}
            <Link href={orderId ? `/dashboard?orderId=${orderId}` : "/dashboard"} className="text-primary hover:underline">
              Go to dashboard
            </Link>
          </p>
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border hover:bg-muted transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book a call to discuss your project
          </a>
        </div>
      </section>
  );
}

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>}>
        <ThankYouContent />
      </Suspense>
      <Footer />
    </main>
  );
}
