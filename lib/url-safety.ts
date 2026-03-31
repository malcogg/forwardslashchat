/**
 * Best-effort outbound URL safety checks to reduce SSRF risk.
 *
 * This does NOT do DNS resolution. It blocks obvious local/private targets
 * (localhost, RFC1918, loopback, link-local, and common non-public TLDs).
 *
 * For higher assurance, add DNS resolution + IP-range verification in a job worker.
 */

function isIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255);
}

function ipv4ToOctets(host: string): [number, number, number, number] | null {
  if (!isIpv4(host)) return null;
  const o = host.split(".").map((p) => Number(p)) as number[];
  return [o[0], o[1], o[2], o[3]];
}

function isPrivateIpv4(host: string): boolean {
  const o = ipv4ToOctets(host);
  if (!o) return false;
  const [a, b] = o;
  // 0.0.0.0/8, 127.0.0.0/8
  if (a === 0 || a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true;
  return false;
}

function isIpv6(host: string): boolean {
  return host.includes(":");
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "::1") return true; // loopback
  if (h.startsWith("fe80:")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local (fc00::/7)
  return false;
}

export function isProbablyPublicInternetHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  if (!h) return false;
  if (h === "localhost") return false;
  if (h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (h === "0.0.0.0") return false;
  if (isIpv4(h) && isPrivateIpv4(h)) return false;
  if (isIpv6(h) && isPrivateIpv6(h)) return false;
  return true;
}

export function assertSafeOutboundHttpUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid URL protocol");
  }

  const host = parsed.hostname;
  if (!isProbablyPublicInternetHost(host)) {
    throw new Error("URL host is not allowed");
  }

  return parsed;
}

