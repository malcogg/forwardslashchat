/**
 * Input validation & sanitization — industry-standard limits and patterns.
 * Use for all user input: forms, APIs, chat. Never trust client input.
 *
 * File uploads: RESTRICTED. Do not add type="file" or accept file uploads
 * without explicit product approval, strict type/size limits, and server validation.
 */

// Character limits (OWASP, RFC, PCI-DSS, common practice)
export const LIMITS = {
  firstName: 50,
  lastName: 50,
  email: 254,
  phone: 25,
  businessName: 100,
  domain: 100,
  websiteUrl: 500,
  subdomain: 63,
  chatMessage: 2000,
  genericText: 255,
  planSlug: 50,
} as const;

// RFC 5322–style email (simplified but robust)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Phone: digits, +, spaces, dashes, parens
const PHONE_SANITIZE = /[^\d+\s\-()]/g;

// Name: letters, spaces, hyphen, apostrophe
const NAME_SANITIZE = /[^\p{L}\p{N}\s\-']/gu;

// Strip control chars (always)
function stripControlChars(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, "");
}

export function isValidEmail(value: string): boolean {
  const trimmed = stripControlChars(value).trim();
  return trimmed.length > 0 && trimmed.length <= LIMITS.email && EMAIL_REGEX.test(trimmed);
}

export function sanitizeEmail(value: string): string {
  return stripControlChars(value)
    .trim()
    .slice(0, LIMITS.email)
    .toLowerCase();
}

export function sanitizePhone(value: string): string {
  return stripControlChars(value)
    .replace(PHONE_SANITIZE, "")
    .slice(0, LIMITS.phone)
    .trim();
}

export function sanitizeFirstName(value: string): string {
  return stripControlChars(value)
    .replace(NAME_SANITIZE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.firstName);
}

export function sanitizeBusinessName(value: string): string {
  return stripControlChars(value)
    .replace(/[^\p{L}\p{N}\s\-'.,&]/gu, "") // allow & and . for "Acme & Co."
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.businessName);
}

export function sanitizeDomain(value: string): string {
  const cleaned = stripControlChars(value)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "")
    .toLowerCase();
  return cleaned.slice(0, LIMITS.domain);
}

export function isValidUrl(value: string): boolean {
  try {
    const v = value.trim();
    const u = v.startsWith("http") ? v : `https://${v}`;
    const parsed = new URL(u);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeWebsiteUrl(value: string): string {
  const trimmed = stripControlChars(value).trim();
  const withProto = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProto);
    const out = `${u.protocol}//${u.hostname}${u.pathname.replace(/\/+$/, "") || ""}`;
    return out.slice(0, LIMITS.websiteUrl);
  } catch {
    return trimmed.slice(0, LIMITS.websiteUrl);
  }
}

export function sanitizeSubdomain(value: string): string {
  const cleaned = stripControlChars(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  return cleaned.slice(0, LIMITS.subdomain) || "chat";
}

export function sanitizeChatMessage(value: string): string {
  return stripControlChars(value)
    .trim()
    .slice(0, LIMITS.chatMessage);
}

export function sanitizeGenericText(value: string, max: number = LIMITS.genericText): string {
  return stripControlChars(value)
    .trim()
    .slice(0, max);
}

// Valid plan slugs (for API validation)
export const VALID_PLAN_SLUGS = new Set([
  "starter",
  "starter-bot",
  "new-build",
  "redesign",
  "chatbot",
  "chatbot-1y",
  "chatbot-2y",
  "chatbot-3y",
]);

export function isValidPlanSlug(slug: unknown): slug is string {
  return typeof slug === "string" && VALID_PLAN_SLUGS.has(slug) && slug.length <= LIMITS.planSlug;
}
