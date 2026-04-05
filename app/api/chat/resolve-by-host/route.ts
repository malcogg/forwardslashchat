import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { checkAndIncrementRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";

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

  // Ignore our main domain and localhost
  const mainHosts = ["forwardslash.chat", "www.forwardslash.chat", "localhost", "127.0.0.1"];
  if (mainHosts.includes(host) || host.endsWith(".vercel.app")) {
    return NextResponse.json({ customerId: null });
  }

  // Parse host: chat.business.com → subdomain=chat, domain=business.com
  const parts = host.split(".");
  if (parts.length < 2) {
    return NextResponse.json({ customerId: null });
  }
  const subdomain = parts[0];
  const domain = parts.slice(1).join(".");

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.domain, domain), eq(customers.subdomain, subdomain)))
    .limit(1);

  return NextResponse.json({
    customerId: customer?.id ?? null,
  });
}
