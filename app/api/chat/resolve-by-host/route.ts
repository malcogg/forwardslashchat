import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkAndIncrementRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { resolveCustomerIdByHost } from "@/lib/resolve-customer-host";

/**
 * GET /api/chat/resolve-by-host?host=chat.business.com
 * Returns { customerId } for host-based routing.
 * Used by middleware when a request hits a custom domain.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const host = searchParams.get("host")?.toLowerCase().trim();
  if (!host || !db) {
    return NextResponse.json({ customerId: null });
  }

  const perMinute = Math.min(120, Math.max(10, Number(process.env.RESOLVE_HOST_RATE_LIMIT_PER_MINUTE ?? 60)));
  const ip = getClientIpFromRequest(request);
  const rl = await checkAndIncrementRateLimit({ key: `resolve_host:${ip}`, limitPerMinute: perMinute });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const customerId = await resolveCustomerIdByHost(host);

  return NextResponse.json({
    customerId,
  });
}
