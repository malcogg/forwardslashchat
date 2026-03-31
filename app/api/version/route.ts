import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/version
 * Returns non-sensitive build metadata to verify which commit is deployed.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    vercel: {
      env: process.env.VERCEL_ENV ?? null, // production | preview | development
      url: process.env.VERCEL_URL ?? null,
      git: {
        commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        commitRef: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      },
    },
    app: {
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    },
    serverTime: new Date().toISOString(),
  });
}

