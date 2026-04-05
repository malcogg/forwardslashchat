import { NextRequest, NextResponse } from "next/server";
import {
  claimNextJob,
  markJobFailed,
  markJobSucceeded,
  recoverStuckRunningJobs,
  JOB_TYPE_AUTO_CRAWL,
  JOB_TYPE_GO_LIVE,
} from "@/lib/jobs";
import { autoCrawlCustomer } from "@/lib/customer-crawl";
import { autoGoLiveCustomer } from "@/lib/go-live";

export const dynamic = "force-dynamic";

function requireCronAuth(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  const maxPerRun = Math.min(25, Math.max(1, Number(process.env.JOBS_MAX_PER_RUN ?? 5)));

  let recoveredStuck = 0;
  try {
    recoveredStuck = await recoverStuckRunningJobs();
  } catch (e) {
    console.error("[cron/jobs] recoverStuckRunningJobs:", e);
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < maxPerRun; i++) {
    const job = await claimNextJob();
    if (!job) break;
    processed++;

    try {
      if (job.type === JOB_TYPE_AUTO_CRAWL) {
        const payload = (job.payload ?? {}) as Record<string, unknown>;
        const customerId = typeof payload.customerId === "string" ? payload.customerId : "";
        const notifyEmail = typeof payload.notifyEmail === "string" ? payload.notifyEmail : null;
        if (!customerId) throw new Error("Missing payload.customerId");

        const overrideMaxPagesRaw = payload.maxPages;
        const overrideMaxPages =
          typeof overrideMaxPagesRaw === "number"
            ? Math.min(500, Math.max(10, Math.round(overrideMaxPagesRaw)))
            : null;

        const res = await autoCrawlCustomer({
          customerId,
          notifyEmail,
          reason: "payment",
          maxPages: overrideMaxPages,
        });
        if (!res.ok) throw new Error(res.error ?? "Auto crawl failed");
      } else if (job.type === JOB_TYPE_GO_LIVE) {
        const payload = (job.payload ?? {}) as Record<string, unknown>;
        const customerId = typeof payload.customerId === "string" ? payload.customerId : "";
        if (!customerId) throw new Error("Missing payload.customerId");

        const res = await autoGoLiveCustomer(customerId);
        if (!res.ok) throw new Error(res.error ?? "Go live failed");
      } else {
        throw new Error(`Unknown job type: ${job.type}`);
      }

      await markJobSucceeded(job);
      succeeded++;
    } catch (e) {
      failed++;
      errors.push(e instanceof Error ? e.message : String(e));
      await markJobFailed(job, e);
    }
  }

  return NextResponse.json({
    ok: true,
    recoveredStuck,
    processed,
    succeeded,
    failed,
    errors: errors.slice(0, 10),
    maxPerRun,
  });
}

