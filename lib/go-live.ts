import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchWithRetry } from "@/lib/fetch-retry";

const CNAME_TARGET = process.env.CNAME_TARGET ?? "cname.vercel-dns.com";

async function resolveCname(host: string): Promise<string | null> {
  const res = await fetchWithRetry(
    `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=CNAME`,
    { timeoutMs: 6_000, maxAttempts: 3, logTag: "dns-verify" }
  );
  const json = (await res.json()) as { Answer?: { data?: string }[] };
  const answers = json.Answer ?? [];
  const cname = answers.find((a) => a.data)?.data?.trim().replace(/\.$/, "");
  return cname ?? null;
}

function normalizeTarget(s: string): string {
  return s.trim().replace(/\.$/, "").toLowerCase();
}

export async function verifyCustomerCname(customDomain: string): Promise<{
  ok: boolean;
  expected: string;
  found: string | null;
}> {
  const expected = normalizeTarget(CNAME_TARGET);
  try {
    const found = await resolveCname(customDomain);
    return { ok: normalizeTarget(found ?? "") === expected, expected, found };
  } catch {
    return { ok: false, expected, found: null };
  }
}

export async function attachDomainToVercel(customDomain: string): Promise<void> {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error("Vercel API not configured (VERCEL_ACCESS_TOKEN, VERCEL_PROJECT_ID)");
  }

  const vercelRes = await fetchWithRetry(
    `https://api.vercel.com/v10/projects/${projectId}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: customDomain }),
      timeoutMs: 10_000,
      maxAttempts: 3,
      baseDelayMs: 500,
      maxDelayMs: 7_000,
      allowNonIdempotentRetry: true,
      logTag: "vercel-domain",
    }
  );

  if (!vercelRes.ok) {
    const err = (await vercelRes.json().catch(() => ({}))) as { error?: { message?: string } };
    const msg = err?.error?.message ?? vercelRes.statusText;
    // Domain might already exist (409) – treat as success.
    if (vercelRes.status !== 409 && !String(msg).toLowerCase().includes("exist")) {
      throw new Error(`Vercel: ${msg}`);
    }
  }
}

export async function autoGoLiveCustomer(customerId: string): Promise<{
  ok: boolean;
  domain?: string;
  chatUrl?: string;
  error?: string;
}> {
  if (!db) return { ok: false, error: "Database not configured" };

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) return { ok: false, error: "Customer not found" };

  const customDomain = `${customer.subdomain}.${customer.domain}`;

  const cname = await verifyCustomerCname(customDomain);
  if (!cname.ok) {
    const found = cname.found ? ` Found: ${cname.found}` : "";
    return {
      ok: false,
      error: `CNAME not verified yet. Expected: ${cname.expected}.${found}`,
    };
  }

  // Mark as "testing" while we attach (best-effort)
  await db.update(customers).set({ status: "testing", updatedAt: new Date() }).where(eq(customers.id, customerId));

  await attachDomainToVercel(customDomain);

  await db
    .update(customers)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  return { ok: true, domain: customDomain, chatUrl: `https://${customDomain}` };
}

