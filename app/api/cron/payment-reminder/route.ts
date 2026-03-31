import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { PaymentReminderEmail } from "@/components/emails/payment-reminder";
import { PaymentReminderFollowUpEmail } from "@/components/emails/payment-reminder-follow-up";

/**
 * GET /api/cron/payment-reminder
 * Vercel Cron: runs daily. Sends a 3-email sequence to users who signed up but never paid.
 *
 * Sequence:
 * - Day 2: "Still want your AI chatbot?"
 * - Day 7: "Your AI chatbot is still waiting" (if they got day 2)
 * - Day 14: "Last chance to get started" (if they got day 7)
 *
 * Secured by CRON_SECRET. Requires reminder_sent table (migration 007).
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

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  try {
    let sent1 = 0;
    let sent2 = 0;
    let sent3 = 0;

    // Step 1: 2+ days, no paid order, never sent payment_reminder_1
    const step1 = await db.execute<{ id: string; email: string; name: string | null }>(
      sql`
        SELECT u.id, u.email, u.name
        FROM users u
        WHERE u.created_at < ${twoDaysAgo}
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'paid')
        AND NOT EXISTS (SELECT 1 FROM reminder_sent rs WHERE rs.user_id = u.id AND rs.reminder_type = 'payment_reminder_1')
      `
    );
    const step1Rows = ((step1 as { rows?: { id: string; email: string; name: string | null }[] }).rows ?? step1) as { id: string; email: string; name: string | null }[];
    const step1List = Array.isArray(step1Rows) ? step1Rows : [];

    for (const user of step1List) {
      if (!user.email) continue;
      const firstName = user.name?.split(" ")[0] ?? undefined;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [user.email],
        subject: "Still want your AI chatbot?",
        react: PaymentReminderEmail({ firstName }),
      });
      if (error) {
        console.error("Payment reminder 1 failed for", user.email, error);
        continue;
      }
      await db.execute(sql`INSERT INTO reminder_sent (user_id, reminder_type) VALUES (${user.id}, 'payment_reminder_1')`);
      sent1++;
    }

    // Step 2: 7+ days, no paid order, has step 1, never sent step 2
    const step2 = await db.execute<{ id: string; email: string; name: string | null }>(
      sql`
        SELECT u.id, u.email, u.name
        FROM users u
        WHERE u.created_at < ${sevenDaysAgo}
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'paid')
        AND EXISTS (SELECT 1 FROM reminder_sent rs WHERE rs.user_id = u.id AND rs.reminder_type = 'payment_reminder_1')
        AND NOT EXISTS (SELECT 1 FROM reminder_sent rs WHERE rs.user_id = u.id AND rs.reminder_type = 'payment_reminder_2')
      `
    );
    const step2Rows = ((step2 as { rows?: { id: string; email: string; name: string | null }[] }).rows ?? step2) as { id: string; email: string; name: string | null }[];
    const step2List = Array.isArray(step2Rows) ? step2Rows : [];

    for (const user of step2List) {
      if (!user.email) continue;
      const firstName = user.name?.split(" ")[0] ?? undefined;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [user.email],
        subject: "Your AI chatbot is still waiting",
        react: PaymentReminderFollowUpEmail({ firstName, step: 2 }),
      });
      if (error) {
        console.error("Payment reminder 2 failed for", user.email, error);
        continue;
      }
      await db.execute(sql`INSERT INTO reminder_sent (user_id, reminder_type) VALUES (${user.id}, 'payment_reminder_2')`);
      sent2++;
    }

    // Step 3: 14+ days, no paid order, has step 2, never sent step 3
    const step3 = await db.execute<{ id: string; email: string; name: string | null }>(
      sql`
        SELECT u.id, u.email, u.name
        FROM users u
        WHERE u.created_at < ${fourteenDaysAgo}
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'paid')
        AND EXISTS (SELECT 1 FROM reminder_sent rs WHERE rs.user_id = u.id AND rs.reminder_type = 'payment_reminder_2')
        AND NOT EXISTS (SELECT 1 FROM reminder_sent rs WHERE rs.user_id = u.id AND rs.reminder_type = 'payment_reminder_3')
      `
    );
    const step3Rows = ((step3 as { rows?: { id: string; email: string; name: string | null }[] }).rows ?? step3) as { id: string; email: string; name: string | null }[];
    const step3List = Array.isArray(step3Rows) ? step3Rows : [];

    for (const user of step3List) {
      if (!user.email) continue;
      const firstName = user.name?.split(" ")[0] ?? undefined;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [user.email],
        subject: "Last chance to get started",
        react: PaymentReminderFollowUpEmail({ firstName, step: 3 }),
      });
      if (error) {
        console.error("Payment reminder 3 failed for", user.email, error);
        continue;
      }
      await db.execute(sql`INSERT INTO reminder_sent (user_id, reminder_type) VALUES (${user.id}, 'payment_reminder_3')`);
      sent3++;
    }

    return NextResponse.json({
      ok: true,
      sent: { step1: sent1, step2: sent2, step3: sent3 },
    });
  } catch (e) {
    console.error("Payment reminder cron error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("reminder_sent") || msg.includes("does not exist")) {
      return NextResponse.json({ error: "Run migration 007-reminder-sent.sql first" }, { status: 503 });
    }
    return NextResponse.json(
      { error: msg || "Cron failed" },
      { status: 500 }
    );
  }
}
