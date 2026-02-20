import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";

/**
 * GET /api/credits
 * Returns current user's Firecrawl credit balance.
 */
export async function GET(request: Request) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const balance = await getCreditBalance(user.userId);
    return NextResponse.json(balance);
  } catch (e) {
    // credit_usage table may not exist yet - run docs/migrations/001-credits.sql
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("credit_usage") || msg.includes("does not exist")) {
      return NextResponse.json({
        creditsUsed: 0,
        creditsLimit: 50,
        remaining: 50,
      });
    }
    throw e;
  }
}
