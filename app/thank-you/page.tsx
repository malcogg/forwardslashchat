"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Check, Calendar } from "lucide-react";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

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
          <p className="text-muted-foreground mb-8">
            We&apos;ve received your payment and we&apos;re building your chatbot now. Check your dashboard in a few minutes.
          </p>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">
              Create an account to track your order and get updates.
            </p>
            <p className="text-xs text-muted-foreground">
              You&apos;ll see your order status and when your content is ready in your dashboard.
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
