const BENEFITS = [
  { title: "No Monthly Fees", icon: "∞" },
  { title: "Fully On Your Domain", icon: "◉" },
  { title: "Trained on Your Content", icon: "◈" },
  { title: "One-Time Starting at $799", icon: "$" },
] as const;

export function BenefitsSection() {
  return (
    <section className="relative -mt-8 mb-8 md:-mt-12 md:mb-12">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          Why Choose ForwardSlash?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {BENEFITS.map(({ title, icon }) => (
            <div
              key={title}
              className="rounded-xl bg-card border border-border p-4 md:p-5 shadow-sm w-full max-w-[180px] mx-auto md:max-w-none md:mx-0 transition-transform duration-200 hover:scale-[1.05] hover:shadow-md"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/20 flex items-center justify-center text-2xl text-muted-foreground">
                {icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center">
                {title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
