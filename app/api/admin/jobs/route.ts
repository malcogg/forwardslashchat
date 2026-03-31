import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/auth";
import { desc } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * GET /api/admin/jobs
 * List recent background jobs. Admin only.
 */
export async function GET(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!isAdmin(user.email ?? undefined)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(100);
  return NextResponse.json(rows);
}

