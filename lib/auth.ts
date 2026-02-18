import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Placeholder used when Clerk has no email. Blocked - users must have a real email to access the dashboard. */
export const FAKE_EMAIL_PLACEHOLDER = "unknown@example.com";

/**
 * Get or create our internal user from Clerk auth.
 * Returns { userId, clerkUserId } or null if not authenticated.
 * Blocks users with unknown@example.com (fake emails used to bypass checkout) - they cannot sign in.
 */
export async function getOrCreateUser() {
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) return null;

  if (!db) return { userId: null, clerkUserId, email: sessionClaims?.email as string | undefined };

  const clerkIdStr = String(clerkUserId);
  const [existing] = await db.select().from(users).where(eq(users.externalId, clerkIdStr));

  if (existing) {
    // Block existing users who signed up with fake email - they bypassed our flow
    if (existing.email === FAKE_EMAIL_PLACEHOLDER) return null;
    return {
      userId: existing.id,
      clerkUserId: clerkIdStr,
      email: existing.email,
    };
  }

  const email = (sessionClaims?.email as string) ?? null;
  // Do not create users without a real email - blocks bypass via email-less sign-up
  if (!email || email === FAKE_EMAIL_PLACEHOLDER) return null;

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
      if (existing.email === FAKE_EMAIL_PLACEHOLDER) return null;
      return {
        userId: existing.id,
        clerkUserId: clerkIdStr,
        email: existing.email,
      };
    }
    throw e;
  }
}
