"use client";

import { useEffect, useState } from "react";

export type DnsPropagationPhase = "dns" | "ssl";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, "0")}s`;
  }
  const h = Math.floor(s / 3600);
  const rm = Math.floor((s % 3600) / 60);
  return `${h}h ${rm}m`;
}

/**
 * Thin status strip while DNS / go-live is in progress (mirrors crawl timer tone: small, muted).
 */
export function DnsPropagationBanner(props: {
  host: string;
  startedAtIso: string;
  phase: DnsPropagationPhase;
  jobActive: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  void tick;
  const started = new Date(props.startedAtIso).getTime();
  const elapsedMs = Number.isFinite(started) ? Math.max(0, Date.now() - started) : 0;
  const elapsedLabel = formatElapsed(elapsedMs);

  const { phase, jobActive, host } = props;
  let lead: string;
  if (phase === "dns") {
    lead = jobActive ? `Checking DNS for ${host}` : `Waiting for DNS at ${host}`;
  } else {
    lead = jobActive ? `Attaching ${host}` : `Finishing HTTPS for ${host}`;
  }
  const tail =
    phase === "dns"
      ? "Usually 5–30 minutes at registrars like Namecheap; allow up to 48 hours worldwide."
      : "Usually a few minutes.";

  return (
    <div
      className="shrink-0 border-b border-border/60 bg-muted/25 px-3 py-1.5 md:px-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] md:text-xs text-muted-foreground leading-snug tabular-nums">
        <span className="font-medium text-foreground/90">{lead}</span>
        <span className="text-muted-foreground"> · {elapsedLabel}</span>
        <span className="hidden sm:inline"> · {tail}</span>
      </p>
      <p className="text-[10px] text-muted-foreground/90 leading-snug mt-0.5 sm:hidden">{tail}</p>
    </div>
  );
}
