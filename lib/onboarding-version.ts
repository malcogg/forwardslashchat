/**
 * Bump this when you change the onboarding flow and want every user to run through it again.
 * Completion writes `extra.onboardingVersion` on POST /api/onboarding.
 * Older rows (backfill, pre-version) have no version → treated as 0 → must re-complete.
 */
export const REQUIRED_ONBOARDING_VERSION = 1;

export function storedOnboardingVersion(extra: Record<string, unknown> | null | undefined): number {
  const v = extra?.onboardingVersion;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
  return 0;
}

/** True only when the user finished onboarding for the current app version. */
export function isOnboardingCompleteForApp(
  row: { completedAt: Date | null } | null | undefined,
  extra: Record<string, unknown> | null | undefined
): boolean {
  if (!row?.completedAt) return false;
  return storedOnboardingVersion(extra) >= REQUIRED_ONBOARDING_VERSION;
}
