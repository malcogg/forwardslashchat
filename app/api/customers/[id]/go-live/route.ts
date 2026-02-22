import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";

const CNAME_TARGET = process.env.CNAME_TARGET ?? "cname.vercel-dns.com";

/**
 * Verify CNAME via DNS-over-HTTPS (Google).
 */
async function verifyCname(host: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(host)}&type=CNAME`
    );
    const json = (await res.json()) as { Answer?: { data?: string }[] };
    const answers = json.Answer ?? [];
    const cname = answers.find((a) => a.data)?.data?.trim().replace(/\.$/, "");
    return cname === CNAME_TARGET.replace(/\.$/, "");
  } catch {
    return false;
  }
}

/**
 * POST /api/customers/[id]/go-live
 * 1. Verify customer CNAME points to our target
 * 2. Add domain to Vercel via API
 * 3. Set customer status to delivered
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser(request);
  if (!user?.userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id: customerId } = await params;
  if (!customerId || !db) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, customer.orderId));
  if (!order || order.userId !== user.userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const customDomain = `${customer.subdomain}.${customer.domain}`;

  // 1) Verify CNAME
  const valid = await verifyCname(customDomain);
  if (!valid) {
    return NextResponse.json(
      {
        error:
          "CNAME not verified. Add the CNAME record at your DNS provider and wait a few minutes for it to propagate.",
      },
      { status: 400 }
    );
  }

  // 2) Add domain to Vercel
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return NextResponse.json(
      {
        error:
          "Vercel API not configured. Add VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID. See docs/VERCEL-DOMAIN-AUTOMATION-SETUP.md",
      },
      { status: 503 }
    );
  }

  const vercelRes = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/domains`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: customDomain }),
    }
  );

  if (!vercelRes.ok) {
    const err = (await vercelRes.json().catch(() => ({}))) as { error?: { message?: string } };
    const msg = err?.error?.message ?? vercelRes.statusText;
    // Domain might already exist (409) – continue to mark delivered
    if (vercelRes.status !== 409 && !String(msg).toLowerCase().includes("exist")) {
      return NextResponse.json(
        { error: `Vercel: ${msg}` },
        { status: 502 }
      );
    }
  }

  // 3) Set status to delivered
  await db
    .update(customers)
    .set({ status: "delivered", updatedAt: new Date() })
    .where(eq(customers.id, customerId));

  return NextResponse.json({
    success: true,
    domain: customDomain,
    chatUrl: `https://${customDomain}`,
  });
}
