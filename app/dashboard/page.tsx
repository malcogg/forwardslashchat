export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-8">Dashboard</h1>

        {/* Order Status */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Order Status
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-foreground">Payment confirmed</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Estimated delivery: 3–10 business days
          </p>
        </section>

        {/* Chatbot Details */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Chatbot
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>URL: chat.yourbusiness.com</li>
            <li>Prepaid until: (date)</li>
          </ul>
        </section>

        {/* DNS Instructions */}
        <section className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            DNS Setup
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add this CNAME record to your DNS:
          </p>
          <pre className="bg-muted p-4 rounded-lg text-sm text-foreground overflow-x-auto">
            {`Type: CNAME
Host/Name: chat
Value/Points to: cname.forwardslash.chat
TTL: Auto`}
          </pre>
        </section>

        {/* Checklist */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Checklist
          </h2>
          <ul className="space-y-2">
            {["Payment confirmed", "Website scanned", "Content selected", "Bot trained", "DNS configured", "Chatbot live"].map(
              (item, i) => (
                <li key={i} className="flex items-center gap-2 text-muted-foreground">
                  <span
                    className={
                      i < 2 ? "text-green-500" : "text-muted-foreground/60"
                    }
                  >
                    {i < 2 ? "✓" : "○"}
                  </span>
                  {item}
                </li>
              )
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
