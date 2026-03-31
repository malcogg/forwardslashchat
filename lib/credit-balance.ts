import { db } from "@/db";
import { creditBalances, creditTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getRescanCreditsBalance(userId: string): Promise<number> {
  if (!db) return 0;
  const [row] = await db.select().from(creditBalances).where(eq(creditBalances.userId, userId));
  return Number(row?.balance ?? 0);
}

export async function addRescanCredits(input: {
  userId: string;
  delta: number;
  reason: "purchase" | "admin";
  stripeSessionId?: string | null;
}): Promise<void> {
  if (!db) return;
  const delta = Math.round(input.delta);
  if (!Number.isFinite(delta) || delta <= 0) return;

  // Ensure balance row exists
  const [existing] = await db.select().from(creditBalances).where(eq(creditBalances.userId, input.userId));
  if (!existing) {
    await db.insert(creditBalances).values({ userId: input.userId, balance: 0, updatedAt: new Date() });
  }

  // Idempotency: if stripeSessionId already recorded, don't double-credit.
  if (input.stripeSessionId) {
    const [tx] = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.stripeSessionId, input.stripeSessionId));
    if (tx) return;
  }

  await db.insert(creditTransactions).values({
    userId: input.userId,
    delta,
    reason: input.reason,
    stripeSessionId: input.stripeSessionId ?? null,
  });

  // Update balance
  const next = (await getRescanCreditsBalance(input.userId)) + delta;
  await db
    .update(creditBalances)
    .set({ balance: next, updatedAt: new Date() })
    .where(eq(creditBalances.userId, input.userId));
}

export async function deductRescanCredits(input: {
  userId: string;
  amount: number;
  reason?: "rescan";
}): Promise<{ ok: boolean; remaining: number }> {
  if (!db) return { ok: true, remaining: 0 };
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: true, remaining: await getRescanCreditsBalance(input.userId) };

  const current = await getRescanCreditsBalance(input.userId);
  if (current < amount) return { ok: false, remaining: current };

  await db.insert(creditTransactions).values({
    userId: input.userId,
    delta: -amount,
    reason: input.reason ?? "rescan",
    stripeSessionId: null,
  });

  const next = current - amount;
  await db
    .update(creditBalances)
    .set({ balance: next, updatedAt: new Date() })
    .where(eq(creditBalances.userId, input.userId));

  return { ok: true, remaining: next };
}

