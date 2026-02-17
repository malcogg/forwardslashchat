import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkoutLeads } from "@/db/schema";

/**
 * POST /api/checkout/lead
 * Save checkout form data before payment (lead capture).
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
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
    } = body as {
      firstName?: string;
      email?: string;
      phone?: string;
      businessName?: string;
      domain?: string;
      websiteUrl?: string;
      planSlug?: string;
      addOns?: string[];
      amountCents?: number;
    };

    if (
      !firstName ||
      !email ||
      !phone ||
      !businessName ||
      typeof planSlug !== "string" ||
      typeof amountCents !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required: firstName, email, phone, businessName, planSlug, amountCents" },
        { status: 400 }
      );
    }

    await db.insert(checkoutLeads).values({
      firstName: String(firstName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      businessName: String(businessName).trim(),
      domain: String(domain ?? "").trim(),
      websiteUrl: String(websiteUrl ?? "").trim(),
      planSlug: String(planSlug).trim(),
      addOns: Array.isArray(addOns) ? addOns : [],
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
