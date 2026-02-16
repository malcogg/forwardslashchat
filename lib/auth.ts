import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get or create our internal user from Clerk auth.
 * Returns { userId, clerkUserId } or null if not authenticated.
 */
export async function getOrCreateUser() {
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) return null;

  if (!db) return { userId: null, clerkUserId, email: sessionClaims?.email as string | undefined };

  const clerkIdStr = String(clerkUserId);
  const [existing] = await db.select().from(users).where(eq(users.externalId, clerkIdStr));

  if (existing) {
    return {
      userId: existing.id,
      clerkUserId: clerkIdStr,
      email: existing.email,
    };
  }

  const email = (sessionClaims?.email as string) ?? "unknown@example.com";
  const name = (sessionClaims?.name as string) ?? (sessionClaims?.firstName as string) ?? null;

  try {
    const [created] = await db
      .insert(users)
      .values({
        externalId: clerkIdStr,
        email,
        name,
      })
      .returning({ id: users.id });

    return {
      userId: created?.id,
      clerkUserId: clerkIdStr,
      email,
    };
  } catch (e) {
    // Race: user may have been created by another request; fetch existing
    const [existing] = await db.select().from(users).where(eq(users.externalId, clerkIdStr));
    if (existing) {
      return {
        userId: existing.id,
        clerkUserId: clerkIdStr,
        email: existing.email,
      };
    }
    throw e;
  }
}
