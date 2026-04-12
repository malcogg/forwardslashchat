import { db } from "@/db";
import { customers } from "@/db/schema";
import { and, sql } from "drizzle-orm";

const MAIN_HOSTS = new Set([
  "forwardslash.chat",
  "www.forwardslash.chat",
  "localhost",
  "127.0.0.1",
]);

/**
 * Map Host header (e.g. chat.client.com) → customer id for middleware rewrite.
 * Case-insensitive; tries apex with and without leading www. to match checkout sanitization.
 */
export async function resolveCustomerIdByHost(hostHeader: string): Promise<string | null> {
  const conn = db;
  if (!conn) return null;

  const host = hostHeader.toLowerCase().split(":")[0]?.trim() ?? "";
  if (!host || MAIN_HOSTS.has(host) || host.endsWith(".vercel.app")) {
    return null;
  }

  const parts = host.split(".");
  if (parts.length < 2) return null;

  const subdomain = parts[0].toLowerCase();
  const apex = parts.slice(1).join(".").toLowerCase();
  const apexNoWww = apex.startsWith("www.") ? apex.slice(4) : apex;

  const match = async (domain: string) => {
    const [row] = await conn
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          sql`lower(${customers.domain}) = ${domain}`,
          sql`lower(${customers.subdomain}) = ${subdomain}`
        )
      )
      .limit(1);
    return row?.id ?? null;
  };

  const candidates = new Set<string>();
  candidates.add(apexNoWww);
  if (apex !== apexNoWww) candidates.add(apex);
  candidates.add(`www.${apexNoWww}`);

  for (const domain of candidates) {
    const id = await match(domain);
    if (id) return id;
  }
  return null;
}
