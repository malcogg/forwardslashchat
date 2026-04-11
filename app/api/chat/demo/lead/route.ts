import { NextResponse } from "next/server";
import { db } from "@/db";
import { demoChatLeads } from "@/db/schema";
import {
  isValidEmail,
  sanitizeEmail,
  sanitizeFirstName,
  sanitizePhone,
} from "@/lib/validation";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/chat/demo/lead
 * Persists demo chat lead capture (name, email, optional phone) or a skipped funnel event.
 */
export async function POST(request: Request) {
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rl = await checkAndIncrementRateLimit({
    key: `demo-lead:${ip}`,
    limitPerMinute: Math.min(30, Math.max(5, Number(process.env.DEMO_LEAD_RATE_LIMIT_PER_MINUTE ?? 15))),
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { skipped, firstName, email, phone } = body as {
      skipped?: unknown;
      firstName?: unknown;
      email?: unknown;
      phone?: unknown;
    };

    if (skipped === true) {
      const [row] = await db
        .insert(demoChatLeads)
        .values({
          skipped: true,
          firstName: null,
          email: null,
          phone: null,
        })
        .returning({ id: demoChatLeads.id });
      return NextResponse.json({ ok: true, id: row?.id });
    }

    if (typeof firstName !== "string" || typeof email !== "string") {
      return NextResponse.json({ error: "firstName and email are required unless skipped is true" }, { status: 400 });
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
      .insert(demoChatLeads)
      .values({
        skipped: false,
        firstName: safeFirst,
        email: safeEmail,
        phone: safePhone && safePhone.length > 0 ? safePhone : null,
      })
      .returning({ id: demoChatLeads.id });

    return NextResponse.json({ ok: true, id: row?.id });
  } catch (e) {
    console.error("Demo lead error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
