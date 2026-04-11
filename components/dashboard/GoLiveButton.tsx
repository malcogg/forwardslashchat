"use client";

import { useEffect, useState } from "react";

export function GoLiveButton({
  customerId,
  customerDomain,
  onSuccess,
  authHeaders,
  className,
}: {
  customerId: string;
  customerDomain: string;
  onSuccess: () => void | Promise<void>;
  authHeaders: () => Promise<HeadersInit>;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "queued" | "running" | "done">("idle");
  const [dnsHint, setDnsHint] = useState<string | null>(null);
  const [dnsLoading, setDnsLoading] = useState(false);

  useEffect(() => {
    if (status !== "queued" && status !== "running") return;
    let stopped = false;
    const tick = async () => {
      try {
        const headers = { ...(await authHeaders()) };
        const res = await fetch(`/api/customers/${customerId}/go-live`, {
          method: "GET",
          headers,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          customerStatus?: string;
          job?: { status?: string; lastError?: string } | null;
        };
        const cs = String(json.customerStatus ?? "");
        if (cs === "delivered") {
          setStatus("done");
          setLoading(false);
          void Promise.resolve(onSuccess()).catch(() => {});
          window.open(`https://${customerDomain}`, "_blank");
          return;
        }
        const js = String(json.job?.status ?? "");
        if (js === "failed") {
          setLoading(false);
          setStatus("idle");
          setError(json.job?.lastError ?? "Could not verify DNS. Check your CNAME and try “Check DNS now” again.");
          return;
        }
        if (js === "running") setStatus("running");
        else setStatus("queued");
      } catch {
        // ignore
      }
    };
    tick();
    const interval = setInterval(() => {
      if (stopped) return;
      tick();
    }, 8_000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [status, customerId, customerDomain, authHeaders, onSuccess]);

  const label = loading
    ? status === "running"
      ? "Connecting domain…"
      : "Checking DNS…"
    : "Check DNS now";

  const probeDnsOnly = async () => {
    setDnsHint(null);
    setDnsLoading(true);
    try {
      const headers = { ...(await authHeaders()) };
      const res = await fetch(`/api/customers/${customerId}/go-live?dnsProbe=1`, {
        method: "GET",
        headers,
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setDnsHint("Could not check DNS. Try again.");
        return;
      }
      const json = (await res.json()) as {
        dnsCheck?: { ok: boolean; expected: string; found: string | null };
      };
      const d = json.dnsCheck;
      if (!d) {
        setDnsHint("No DNS data returned.");
        return;
      }
      if (d.ok) {
        setDnsHint(`CNAME looks correct (points to ${d.expected}). You can use “Check DNS now” to attach the domain.`);
      } else {
        const found = d.found ? `Currently: ${d.found}` : "No CNAME found yet.";
        setDnsHint(`Expected CNAME → ${d.expected}. ${found} Propagation can take up to 48 hours.`);
      }
    } catch {
      setDnsHint("DNS check failed. Try again.");
    } finally {
      setDnsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <button
        onClick={async () => {
          setError(null);
          setLoading(true);
          try {
            const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
            const res = await fetch(`/api/customers/${customerId}/go-live`, {
              method: "POST",
              headers,
              credentials: "include",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
              throw new Error((json as { error?: string }).error ?? "Request failed");
            }
            setStatus("queued");
            setLoading(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Request failed");
            setLoading(false);
          }
        }}
        disabled={loading}
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {label}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && !error && (
        <p className="text-xs text-muted-foreground">
          We’ll keep checking your DNS and attach your domain automatically once it propagates.
        </p>
      )}
      <button
        type="button"
        onClick={() => void probeDnsOnly()}
        disabled={dnsLoading}
        className="w-full text-xs text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-900 dark:hover:text-emerald-300 disabled:opacity-50"
      >
        {dnsLoading ? "Checking DNS record…" : "Check DNS record only (no attach yet)"}
      </button>
      {dnsHint && <p className="text-xs text-muted-foreground leading-relaxed">{dnsHint}</p>}
    </div>
  );
}
