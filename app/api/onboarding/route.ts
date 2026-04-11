import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/db";
import { userOnboarding } from "@/db/schema";

const completeBodySchema = z.object({
  path: z.enum(["has_website", "no_website"]),
  websiteUrlSnapshot: z.string().max(2048).optional().nullable(),
  noSiteProjectNote: z.string().max(2000).optional().nullable(),
  assistantPrimaryUse: z.string().max(200).optional().nullable(),
  industry: z.string().max(200).optional().nullable(),
  referralSource: z.string().max(200).optional().nullable(),
  dnsHelpPreference: z.enum(["self", "guided", "someone_else"]).optional().nullable(),
  hasExistingAiChat: z.boolean().optional().nullable(),
  skippedStepIds: z.array(z.string()).optional(),
  /** Minimal completion — skips questions */
  skipEntireFlow: z.boolean().optional(),
});

function normalizeUrl(raw: string | null | undefined): string | null {
  if (raw == null || !raw.trim()) return null;
  const t = raw.trim();
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    return u.origin + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return t;
  }
}

export async function GET(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!db) {
    return NextResponse.json({ completed: true, disabled: true });
  }

  const [row] = await db
    .select({
      completedAt: userOnboarding.completedAt,
      path: userOnboarding.path,
    })
    .from(userOnboarding)
    .where(eq(userOnboarding.userId, user.userId));

  return NextResponse.json({
    completed: row?.completedAt != null,
    path: row?.path ?? null,
  });
}

export async function POST(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = completeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const skipAll = data.skipEntireFlow === true;
  const path = skipAll ? "has_website" : data.path;
  const websiteUrlSnapshot = skipAll ? null : normalizeUrl(data.websiteUrlSnapshot);
  const skipped = skipAll
    ? ["intro", "path", "site", "goal", "hasAi", "industry", "referral", "last", "pricing"]
    : (data.skippedStepIds ?? []);

  const now = new Date();

  await db
    .insert(userOnboarding)
    .values({
      userId: user.userId,
      path,
      referralSource: skipAll ? null : (data.referralSource ?? null),
      hasExistingAiChat: skipAll ? null : (data.hasExistingAiChat ?? null),
      industry: skipAll ? null : (data.industry ?? null),
      dnsHelpPreference: skipAll ? null : (data.dnsHelpPreference ?? null),
      assistantPrimaryUse: skipAll ? null : (data.assistantPrimaryUse ?? null),
      websiteUrlSnapshot: skipAll ? null : websiteUrlSnapshot,
      noSiteProjectNote: skipAll ? null : (data.noSiteProjectNote?.trim() || null),
      noSiteTimeline: null,
      skippedStepIds: skipped,
      extra: {},
      completedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userOnboarding.userId,
      set: {
        path,
        referralSource: skipAll ? null : (data.referralSource ?? null),
        hasExistingAiChat: skipAll ? null : (data.hasExistingAiChat ?? null),
        industry: skipAll ? null : (data.industry ?? null),
        dnsHelpPreference: skipAll ? null : (data.dnsHelpPreference ?? null),
        assistantPrimaryUse: skipAll ? null : (data.assistantPrimaryUse ?? null),
        websiteUrlSnapshot: skipAll ? null : websiteUrlSnapshot,
        noSiteProjectNote: skipAll ? null : (data.noSiteProjectNote?.trim() || null),
        skippedStepIds: skipped,
        completedAt: now,
        updatedAt: now,
      },
    });

  return NextResponse.json({ ok: true });
}
