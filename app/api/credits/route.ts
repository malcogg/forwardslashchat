import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getCreditBalance } from "@/lib/credits";

/**
 * GET /api/credits
 * Returns current user's Firecrawl credit balance.
 */
export async function GET() {
  const user = await getOrCreateUser();
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const balance = await getCreditBalance(user.userId);
  return NextResponse.json(balance);
}
