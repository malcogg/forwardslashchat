import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Placeholder used when Clerk has no email. Blocked - users must have a real email to access the dashboard. */
export const FAKE_EMAIL_PLACEHOLDER = "unknown@example.com";

const AUTHORIZED_PARTIES = [
  "https://forwardslash.chat",
  "https://www.forwardslash.chat",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/**
 * Resolve Clerk userId and session claims, from either auth() or authenticateRequest(request).
 * When request is provided, uses authenticateRequest so the Bearer token in the Authorization header is accepted (fixes 401 when cookie is not sent).
 */
async function getClerkAuth(request?: Request): Promise<{ userId: string; email: string | null; name: string | null } | null> {
  if (request) {
    const client = await clerkClient();
    const authState = await client.authenticateRequest(request, {
      authorizedParties: AUTHORIZED_PARTIES,
    });
    if (!authState.isAuthenticated || !authState.toAuth) return null;
    const clerkAuth = authState.toAuth();
    const clerkUserId = clerkAuth.userId;
    if (!clerkUserId) return null;
    try {
      const clerkUser = await client.users.getUser(clerkUserId);
      const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
      const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      return { userId: clerkUserId, email, name };
    } catch {
      return { userId: clerkUserId, email: null, name: null };
    }
  }
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) return null;
  const email = (sessionClaims?.email as string) ?? null;
  const name = (sessionClaims?.name as string) ?? (sessionClaims?.firstName as string) ?? null;
  return { userId: clerkUserId, email, name };
}

/**
 * Get or create our internal user from Clerk auth.
 * Pass request in API routes so the Bearer token (Authorization header) is accepted when the session cookie is not sent.
 * Returns { userId, clerkUserId } or null if not authenticated.
 * Blocks users with unknown@example.com (fake emails used to bypass checkout) - they cannot sign in.
 */
export async function getOrCreateUser(request?: Request) {
  const clerkAuth = await getClerkAuth(request);
  if (!clerkAuth) return null;
  const { userId: clerkUserId, email: emailFromClerk, name: nameFromClerk } = clerkAuth;
  const clerkIdStr = String(clerkUserId);

  if (!db) return { userId: null, clerkUserId, email: emailFromClerk ?? undefined };

  const [existing] = await db.select().from(users).where(eq(users.externalId, clerkIdStr));

  if (existing) {
    if (existing.email === FAKE_EMAIL_PLACEHOLDER) return null;
    return {
      userId: existing.id,
      clerkUserId: clerkIdStr,
      email: existing.email,
    };
  }

  const email = emailFromClerk ?? null;
  if (!email || email === FAKE_EMAIL_PLACEHOLDER) return null;

  const name = nameFromClerk ?? null;

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
