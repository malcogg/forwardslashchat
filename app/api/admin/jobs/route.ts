import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { getOrCreateUser } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

const JOB_STATUSES = new Set(["queued", "running", "succeeded", "failed"]);

/**
 * GET /api/admin/jobs
 * List recent background jobs. Admin only.
 *
 * Query: `status=failed` (or queued|running|succeeded) — filter by status (e.g. errors).
 * `limit` — default 100, max 200.
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limitRaw = Number(searchParams.get("limit") ?? "100");
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 100));

  const rows =
    status && JOB_STATUSES.has(status)
      ? await db
          .select()
          .from(jobs)
          .where(eq(jobs.status, status))
          .orderBy(desc(jobs.updatedAt))
          .limit(limit)
      : await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);

  return NextResponse.json(rows);
}

