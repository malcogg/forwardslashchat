/**
 * Small-print disclaimer on customer-facing full-page chat (/chat/c/*).
 */

function toPublicWebsiteHref(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  try {
    const u =
      t.startsWith("http://") || t.startsWith("https://") ? new URL(t) : new URL(`https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function websiteLinkLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "website";
  }
}

export function CustomerChatAiDisclaimer({ websiteUrl }: { websiteUrl?: string | null }) {
  const href = toPublicWebsiteHref(websiteUrl);
  const hostLabel = href ? websiteLinkLabel(href) : null;

  return (
    <footer
      className="shrink-0 border-t border-gray-200 bg-gray-50/95 px-4 py-2.5 text-center text-[10px] sm:text-[11px] leading-snug text-gray-500"
      role="contentinfo"
    >
      <p>Our AI can make mistakes. Please double-check responses.</p>
      {href && hostLabel ? (
        <p className="mt-1.5">
          For official information, visit{" "}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline underline-offset-2"
          >
            {hostLabel}
          </a>
          .
        </p>
      ) : null}
    </footer>
  );
}
