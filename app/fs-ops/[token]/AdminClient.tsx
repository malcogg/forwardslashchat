"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  LIMITS,
  sanitizeBusinessName,
  sanitizeDomain,
  sanitizeSubdomain,
} from "@/lib/validation";

type OrderRow = {
  order: {
    id: string;
    status: string;
    amountCents: number;
    bundleYears: number;
    createdAt: string;
  };
  customer: {
    id: string;
    businessName: string;
    domain: string;
    websiteUrl: string;
    status: string;
  } | null;
};

export default function AdminClient() {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ websiteUrl: "", businessName: "", domain: "", subdomain: "chat" });

  const createTestOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOrders((prev) => [{ order: data.order, customer: data.customer }, ...prev]);
      setForm({ websiteUrl: "", businessName: "", domain: "", subdomain: "chat" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Access denied");
        return res.json();
      })
      .then(setOrders)
      .catch(() => setError("Access denied. Add your email to ADMIN_EMAILS in Vercel."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-background">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">
          Add ADMIN_EMAILS=your@email.com to Vercel env vars to access admin APIs.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-primary hover:underline">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">Operations</h1>
        <div className="flex gap-2">
          <span className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</span>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">
            Dashboard
          </Link>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        All orders. Use for testing and fulfillment. Admins bypass credit limits on crawl.
      </p>

      <section className="mb-8 p-4 bg-card border border-border rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Create test order (no payment)</h2>
        <form onSubmit={createTestOrder} className="grid gap-3 max-w-md">
          <input
            type="url"
            placeholder="Website URL"
            value={form.websiteUrl}
            onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value.slice(0, LIMITS.websiteUrl) }))}
            maxLength={LIMITS.websiteUrl}
            className="px-3 py-2 rounded-lg border border-input text-foreground"
            required
          />
          <input
            type="text"
            placeholder="Business name"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: sanitizeBusinessName(e.target.value) }))}
            maxLength={LIMITS.businessName}
            className="px-3 py-2 rounded-lg border border-input text-foreground"
            required
          />
          <input
            type="text"
            placeholder="Domain (e.g. test.com)"
            value={form.domain}
            onChange={(e) => setForm((f) => ({ ...f, domain: sanitizeDomain(e.target.value) }))}
            maxLength={LIMITS.domain}
            className="px-3 py-2 rounded-lg border border-input text-foreground"
            required
          />
          <input
            type="text"
            placeholder="Subdomain (default: chat)"
            value={form.subdomain}
            onChange={(e) => setForm((f) => ({ ...f, subdomain: sanitizeSubdomain(e.target.value) }))}
            maxLength={LIMITS.subdomain}
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create test order"}
          </button>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2">Order</th>
              <th className="text-left py-2 px-2">Business</th>
              <th className="text-left py-2 px-2">Website</th>
              <th className="text-left py-2 px-2">Status</th>
              <th className="text-left py-2 px-2">Amount</th>
              <th className="text-left py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(({ order, customer }) => (
              <tr key={order.id} className="border-b border-border">
                <td className="py-2 px-2 font-mono text-xs">{order.id.slice(0, 8)}…</td>
                <td className="py-2 px-2">{customer?.businessName ?? "—"}</td>
                <td className="py-2 px-2 truncate max-w-[160px]">{customer?.websiteUrl ?? "—"}</td>
                <td className="py-2 px-2">{customer?.status ?? order.status}</td>
                <td className="py-2 px-2">${(order.amountCents / 100).toLocaleString()}</td>
                <td className="py-2 px-2">
                  <Link href={`/dashboard?orderId=${order.id}`} className="text-primary hover:underline">
                    View
                  </Link>
                  {customer && (
                    <>
                      {" · "}
                      <Link href={`/chat/c/${customer.id}`} className="text-primary hover:underline" target="_blank">
                        Chat
                      </Link>
                      {" · "}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          fetch(`/api/customers/${customer.id}/crawl`, { method: "POST" }).then(async (r) => {
                            if (r.ok) alert("Crawl started");
                            else {
                              const d = await r.json();
                              alert(d.error ?? "Failed");
                            }
                          });
                        }}
                      >
                        Crawl
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && <p className="text-muted-foreground py-8">No orders yet.</p>}
    </main>
  );
}
