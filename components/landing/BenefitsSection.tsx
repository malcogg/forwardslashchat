const BENEFITS = [
  "No Monthly Fees",
  "Fully On Your Domain",
  "Trained on Your Content",
  "One-Time Starting at $799",
] as const;

export function BenefitsSection() {
  return (
    <section className="relative -mt-8 mb-8 md:-mt-12 md:mb-12">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground">
          {BENEFITS.join(" · ")}
        </p>
      </div>
    </section>
  );
}
