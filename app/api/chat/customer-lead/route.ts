import { NextResponse } from "next/server";
import { db } from "@/db";
import { customerChatLeads } from "@/db/schema";
import {
  isValidEmail,
  sanitizeEmail,
  sanitizeFirstName,
  sanitizePhone,
} from "@/lib/validation";
import { checkAndIncrementRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { getPaidCustomerForChat } from "@/lib/customer-chat-access";

/**
 * POST /api/chat/customer-lead
 * Body: { customerId, skipped?: true } | { customerId, firstName, email, phone? }
 * Persists optional visitor contact for paid customer chat widgets.
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ip = getClientIpFromRequest(request);
  const perMinute = Math.min(
    40,
    Math.max(5, Number(process.env.CUSTOMER_CHAT_LEAD_RATE_LIMIT_PER_MINUTE ?? 20))
  );
  const rl = await checkAndIncrementRateLimit({
    key: `cust-chat-lead:${ip}`,
    limitPerMinute: perMinute,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { customerId, skipped, firstName, email, phone } = body as {
      customerId?: unknown;
      skipped?: unknown;
      firstName?: unknown;
      email?: unknown;
      phone?: unknown;
    };

    if (typeof customerId !== "string" || !customerId.trim()) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const access = await getPaidCustomerForChat(customerId.trim());
    if (!access.ok) {
      if (access.reason === "not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (access.reason === "payment_required") {
        return NextResponse.json({ error: "Not available" }, { status: 403 });
      }
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (skipped === true) {
      const [row] = await db
        .insert(customerChatLeads)
        .values({
          customerId: access.customer.id,
          skipped: true,
          firstName: null,
          email: null,
          phone: null,
        })
        .returning({ id: customerChatLeads.id });
      return NextResponse.json({ ok: true, id: row?.id });
    }

    if (typeof firstName !== "string" || typeof email !== "string") {
      return NextResponse.json(
        { error: "firstName and email are required unless skipped is true" },
        { status: 400 }
      );
    }

    const safeFirst = sanitizeFirstName(firstName);
    const safeEmail = sanitizeEmail(email);
    const safePhone =
      typeof phone === "string" && phone.trim() !== "" ? sanitizePhone(phone) : null;

    if (!safeFirst) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }
    if (!isValidEmail(safeEmail)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const [row] = await db
      .insert(customerChatLeads)
      .values({
        customerId: access.customer.id,
        skipped: false,
        firstName: safeFirst,
        email: safeEmail,
        phone: safePhone && safePhone.length > 0 ? safePhone : null,
      })
      .returning({ id: customerChatLeads.id });

    return NextResponse.json({ ok: true, id: row?.id });
  } catch (e) {
    console.error("Customer chat lead error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
