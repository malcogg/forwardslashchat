import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkoutLeads } from "@/db/schema";
import {
  isValidEmail,
  sanitizeFirstName,
  sanitizePhone,
  sanitizeBusinessName,
  sanitizeDomain,
  sanitizeWebsiteUrl,
  sanitizeEmail,
  isValidPlanSlug,
  isValidUrl,
} from "@/lib/validation";

const VALID_ADD_ONS = new Set([
  "dns",
  "ai-chatbot",
  "logo",
  "seo",
  "blog",
  "starter",
  "new-build",
  "redesign",
  "social-media",
]);

function sanitizeAddOns(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is string => typeof v === "string" && VALID_ADD_ONS.has(v))
    .slice(0, 10);
}

/**
 * POST /api/checkout/lead
 * Save checkout form data before payment (lead capture).
 * Server-side validation — never trust client input.
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {
      firstName,
      email,
      phone,
      businessName,
      domain,
      websiteUrl,
      planSlug,
      addOns,
      amountCents,
    } = body as Record<string, unknown>;

    if (
      typeof firstName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof businessName !== "string" ||
      typeof domain !== "string" ||
      typeof websiteUrl !== "string" ||
      !isValidPlanSlug(planSlug) ||
      typeof amountCents !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid: firstName, email, phone, businessName, domain, websiteUrl, planSlug, amountCents" },
        { status: 400 }
      );
    }

    const safeFirstName = sanitizeFirstName(firstName);
    const safeEmail = sanitizeEmail(email);
    const safePhone = sanitizePhone(phone);
    const safeBusinessName = sanitizeBusinessName(businessName);
    const safeDomain = sanitizeDomain(domain);
    const safeWebsiteUrl = sanitizeWebsiteUrl(websiteUrl);

    if (!safeFirstName) {
      return NextResponse.json({ error: "First name required" }, { status: 400 });
    }
    if (!isValidEmail(safeEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (!safePhone || safePhone.length < 10) {
      return NextResponse.json({ error: "Valid phone required (min 10 digits)" }, { status: 400 });
    }
    if (!safeBusinessName) {
      return NextResponse.json({ error: "Business name required" }, { status: 400 });
    }
    if (!safeDomain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }
    if (!safeWebsiteUrl || !isValidUrl(safeWebsiteUrl)) {
      return NextResponse.json({ error: "Valid website URL required" }, { status: 400 });
    }
    if (amountCents < 0 || amountCents > 999_999_99) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const safeAddOns = sanitizeAddOns(addOns);

    await db.insert(checkoutLeads).values({
      firstName: safeFirstName,
      email: safeEmail,
      phone: safePhone,
      businessName: safeBusinessName,
      domain: safeDomain,
      websiteUrl: safeWebsiteUrl,
      planSlug: String(planSlug),
      addOns: safeAddOns,
      amountCents,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Checkout lead error:", e);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}
