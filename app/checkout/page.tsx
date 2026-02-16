"use client";

import { Suspense, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Button } from "@/components/ui/button";

const PLANS: Record<string, { name: string; price: number }> = {
  starter: {
    name: "Quick WordPress Starter",
    price: 350,
  },
  "new-build": {
    name: "Brand New Website Build",
    price: 1000,
  },
  redesign: {
    name: "Website Redesign / Refresh",
    price: 2000,
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planSlug = searchParams.get("plan") ?? "starter";
  const plan = PLANS[planSlug] ?? PLANS.starter;

  return (
    <section className="py-20 px-6">
        <div className="max-w-lg mx-auto">
          <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
            Checkout
          </h1>
          <p className="text-muted-foreground mb-8">
            Review your selection and proceed.
          </p>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">Selected plan</p>
            <h2 className="font-serif text-xl text-foreground mt-1">
              {plan.name}
            </h2>
            <p className="text-2xl font-bold text-foreground mt-4">
              ${plan.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">one-time</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Year 1 hosting included. No monthly fees.
            </p>

            <Button
              asChild
              className="mt-8 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-base"
            >
              <a href="#">Proceed</a>
            </Button>

            <Link
              href="/services"
              className="block mt-4 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to services
            </Link>
          </div>
        </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="py-20 px-6 text-center text-muted-foreground">Loading...</div>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}
