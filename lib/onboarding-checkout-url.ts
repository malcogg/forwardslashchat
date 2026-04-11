/** Build `/checkout` query string for chatbot plans from onboarding pricing step. */
export function normalizeCheckoutPages(n: number): number {
  return Math.min(499, Math.max(1, Math.round(n)));
}

export function buildOnboardingCheckoutHref(opts: {
  pages: number;
  years: 1 | 2;
  url?: string | null;
  preselectDns: boolean;
}): string {
  const plan = opts.years === 2 ? "chatbot-2y" : "chatbot-1y";
  const p = new URLSearchParams();
  p.set("plan", plan);
  p.set("pages", String(normalizeCheckoutPages(opts.pages)));
  p.set("years", String(opts.years));
  const u = opts.url?.trim();
  if (u) p.set("url", u.startsWith("http") ? u : `https://${u}`);
  if (opts.preselectDns) p.set("dns", "1");
  return `/checkout?${p.toString()}`;
}
