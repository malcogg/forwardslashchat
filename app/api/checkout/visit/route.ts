import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkoutVisits } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

/**
 * POST /api/checkout/visit
 * Record that a signed-in user viewed the checkout page (for abandonment emails).
 */
export async function POST(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ ok: true });
  }

  try {
    await db.execute(sql`
      INSERT INTO checkout_visits (user_id, visited_at)
      VALUES (${user.userId}, now())
      ON CONFLICT (user_id) DO UPDATE SET visited_at = now()
    `);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
