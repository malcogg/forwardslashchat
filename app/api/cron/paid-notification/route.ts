import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, users } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { PaymentConfirmedBuildEmail } from "@/components/emails/payment-confirmed-build";
import { BuildReminderEmail } from "@/components/emails/build-reminder";

/**
 * GET /api/cron/paid-notification
 * Vercel Cron: runs every 10–15 min.
 *
 * 1) Newly paid: orders where status = 'paid' AND paid_notification_sent_at IS NULL
 *    → Send "Payment confirmed – build your chatbot" → set paid_notification_sent_at.
 * 2) Optional: paid 2+ days ago, notification sent, still no content
 *    → Send "Build your bot to get started" reminder → set build_reminder_sent_at.
 *
 * Secured by CRON_SECRET. Requires migration 008 (orders.paid_notification_sent_at, build_reminder_sent_at).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!resend) {
    return NextResponse.json({ error: "Resend not configured" }, { status: 503 });
  }

  try {
    let paidNotificationSent = 0;
    let buildReminderSent = 0;

    // 1) Newly paid: send "Payment confirmed – build your chatbot"
    const newlyPaid = await db
      .select({
        orderId: orders.id,
        userEmail: users.email,
        userName: users.name,
        customerBusinessName: customers.businessName,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .leftJoin(customers, eq(customers.orderId, orders.id))
      .where(and(eq(orders.status, "paid"), isNull(orders.paidNotificationSentAt)));

    for (const row of newlyPaid) {
      if (!row.userEmail) continue;
      const firstName = row.userName?.split(" ")[0] ?? undefined;
      const businessName = row.customerBusinessName ?? undefined;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [row.userEmail],
        subject: "Payment confirmed – build your chatbot",
        react: PaymentConfirmedBuildEmail({ firstName, businessName }),
      });
      if (error) {
        console.error("[paid-notification] Failed for order", row.orderId, error);
        continue;
      }
      await db
        .update(orders)
        .set({ paidNotificationSentAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, row.orderId));
      paidNotificationSent++;
    }

    // 2) Optional: paid notification sent 2+ days ago, no content yet → "Build your bot" reminder
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const needReminder = await db.execute(sql`
      SELECT o.id AS order_id, o.user_id AS user_id, u.email AS email, u.name AS name, c.business_name AS business_name
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      INNER JOIN customers c ON c.order_id = o.id
      WHERE o.status = 'paid'
        AND o.paid_notification_sent_at IS NOT NULL
        AND o.paid_notification_sent_at < ${twoDaysAgo}
        AND o.build_reminder_sent_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM content ct WHERE ct.customer_id = c.id)
    `);
    type ReminderRow = { order_id: string; user_id: string; email: string; name: string | null; business_name: string };
    const reminderRows = ((needReminder as { rows?: ReminderRow[] }).rows ?? needReminder) as ReminderRow[] | unknown;
    const list = Array.isArray(reminderRows) ? reminderRows : [];

    for (const row of list) {
      if (!row.email) continue;
      const firstName = row.name?.split(" ")[0] ?? undefined;
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [row.email],
        subject: "Build your bot to get started",
        react: BuildReminderEmail({ firstName, businessName: row.business_name }),
      });
      if (error) {
        console.error("[paid-notification] Build reminder failed for order", row.order_id, error);
        continue;
      }
      await db
        .update(orders)
        .set({ buildReminderSentAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, row.order_id));
      buildReminderSent++;
    }

    return NextResponse.json({
      ok: true,
      paidNotificationSent,
      buildReminderSent,
    });
  } catch (e) {
    console.error("Paid notification cron error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}
