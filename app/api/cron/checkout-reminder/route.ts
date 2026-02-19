import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { CheckoutReminderEmail } from "@/components/emails/checkout-reminder";

const VISIT_MIN_HOURS = 4;
const VISIT_MAX_HOURS = 24;

/**
 * GET /api/cron/checkout-reminder
 * Vercel Cron: runs daily. Sends reminder to signed-in users who visited
 * /checkout 4–24h ago and have no paid order.
 *
 * Secured by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  if (!resend) {
    return NextResponse.json(
      { error: "Resend not configured" },
      { status: 503 }
    );
  }

  const minAgo = new Date();
  minAgo.setHours(minAgo.getHours() - VISIT_MIN_HOURS);
  const maxAgo = new Date();
  maxAgo.setHours(maxAgo.getHours() - VISIT_MAX_HOURS);

  try {
    const result = await db.execute<{ id: string; email: string; name: string | null }>(
      sql`
        SELECT u.id, u.email, u.name
        FROM users u
        INNER JOIN checkout_visits cv ON cv.user_id = u.id
        WHERE cv.visited_at >= ${maxAgo}
        AND cv.visited_at <= ${minAgo}
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.user_id = u.id AND o.status = 'paid'
        )
      `
    );

    const rows = result.rows ?? result;
    const toRemind = Array.isArray(rows) ? rows : [];

    let sent = 0;
    for (const user of toRemind) {
      const email = user.email;
      if (!email) continue;

      const firstName = user.name?.split(" ")[0] ?? undefined;

      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [email],
        subject: "Finish your AI chatbot order",
        react: CheckoutReminderEmail({ firstName }),
      });

      if (error) {
        console.error("Checkout reminder failed for", email, error);
        continue;
      }
      sent++;
    }

    return NextResponse.json({
      ok: true,
      eligible: toRemind.length,
      sent,
    });
  } catch (e) {
    console.error("Checkout reminder cron error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("checkout_visits") || msg.includes("does not exist")) {
      return NextResponse.json({ ok: false, error: "Run migration 006-checkout-visits.sql first" }, { status: 503 });
    }
    return NextResponse.json(
      { error: msg || "Cron failed" },
      { status: 500 }
    );
  }
}
