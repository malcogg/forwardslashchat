import { db } from "@/db";
import { users, creditUsage, FIRECRAWL_PLANS } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_PLAN = "free";

function getCreditsLimit(plan: string): number {
  const p = plan as keyof typeof FIRECRAWL_PLANS;
  const base = FIRECRAWL_PLANS[p]?.credits ?? FIRECRAWL_PLANS.free.credits;
  // Env override: FIRECRAWL_CREDITS_FREE=50, FIRECRAWL_CREDITS_HOBBY=100, etc.
  const envKey = `FIRECRAWL_CREDITS_${(p || "free").toUpperCase()}`;
  const envVal = process.env[envKey];
  return envVal ? parseInt(envVal, 10) || base : base;
}

function isMonthlyReset(plan: string): boolean {
  const p = plan as keyof typeof FIRECRAWL_PLANS;
  return FIRECRAWL_PLANS[p]?.period === "monthly";
}

/**
 * Get or create credit usage for user. Returns { creditsUsed, creditsLimit, remaining }.
 */
export async function getCreditBalance(userId: string): Promise<{
  creditsUsed: number;
  creditsLimit: number;
  remaining: number;
}> {
  if (!db) {
    return { creditsUsed: 0, creditsLimit: 50, remaining: 50 };
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const plan = user?.firecrawlPlan ?? DEFAULT_PLAN;
  const limit = getCreditsLimit(plan);

  let [usage] = await db.select().from(creditUsage).where(eq(creditUsage.userId, userId));

  if (!usage) {
    const [created] = await db
      .insert(creditUsage)
      .values({ userId, creditsUsed: 0 })
      .returning();
    usage = created!;
  }

  // Monthly reset for non-free plans
  if (usage && isMonthlyReset(plan)) {
    const periodStart = new Date(usage.periodStart);
    const now = new Date();
    if (now.getMonth() !== periodStart.getMonth() || now.getFullYear() !== periodStart.getFullYear()) {
      await db
        .update(creditUsage)
        .set({
          creditsUsed: 0,
          periodStart: now,
          updatedAt: now,
        })
        .where(eq(creditUsage.userId, userId));
      usage = { ...usage, creditsUsed: 0, periodStart: now };
    }
  }

  const used = usage?.creditsUsed ?? 0;
  const remaining = Math.max(0, limit - used);

  return { creditsUsed: used, creditsLimit: limit, remaining };
}

/**
 * Deduct credits. Returns true if successful, false if insufficient.
 */
export async function deductCredits(
  userId: string,
  amount: number
): Promise<{ ok: boolean; remaining: number }> {
  if (!db || amount <= 0) {
    return { ok: true, remaining: 0 };
  }

  const balance = await getCreditBalance(userId);
  if (balance.remaining < amount) {
    return { ok: false, remaining: balance.remaining };
  }

  const [usage] = await db.select().from(creditUsage).where(eq(creditUsage.userId, userId));
  if (!usage) {
    return { ok: false, remaining: 0 };
  }

  await db
    .update(creditUsage)
    .set({
      creditsUsed: usage.creditsUsed + amount,
      updatedAt: new Date(),
    })
    .where(eq(creditUsage.userId, userId));

  return { ok: true, remaining: balance.remaining - amount };
}
