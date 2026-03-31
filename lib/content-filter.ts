export type CrawledPage = {
  sourceUrl: string;
  title: string;
  markdown: string;
};

const DROP_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".rar",
  ".7z",
  ".mp4",
  ".mov",
  ".avi",
  ".mp3",
  ".wav",
  ".json",
  ".xml",
]);

const DROP_PATH_PARTS = [
  "/wp-json",
  "/wp-admin",
  "/cart",
  "/checkout",
  "/my-account",
  "/account",
  "/login",
  "/logout",
  "/signin",
  "/sign-in",
  "/signup",
  "/sign-up",
  "/register",
  "/admin",
  "/tag/",
  "/category/",
  "/author/",
  "/feed",
  "/rss",
  "/search",
];

function stripTracking(url: URL): URL {
  // Remove query/hash to reduce duplicates (UTM, session ids, etc.)
  url.hash = "";
  url.search = "";
  return url;
}

export function normalizeContentUrl(raw: string): string {
  try {
    const u = stripTracking(new URL(raw));
    // normalize trailing slash
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return raw;
  }
}

export function shouldKeepCrawledPage(input: CrawledPage): boolean {
  const md = (input.markdown ?? "").trim();
  if (md.length < 80) return false;

  let u: URL | null = null;
  try {
    u = new URL(input.sourceUrl);
  } catch {
    return false;
  }

  const pathname = u.pathname.toLowerCase();
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot !== -1) {
    const ext = pathname.slice(lastDot);
    if (DROP_EXTENSIONS.has(ext)) return false;
  }

  const fullPath = `${pathname}${u.search}`.toLowerCase();
  if (DROP_PATH_PARTS.some((p) => fullPath.includes(p))) return false;

  return true;
}

