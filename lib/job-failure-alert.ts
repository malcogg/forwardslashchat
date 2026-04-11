import { FROM_EMAIL, resend } from "@/lib/resend";

function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Email ADMIN_EMAILS when a background job is marked failed after exhausting retries.
 * No-op if Resend or ADMIN_EMAILS is not configured.
 */
export async function notifyAdminsJobPermanentlyFailed(input: {
  jobId: string;
  type: string;
  dedupeKey: string | null;
  lastError: string;
  attempts: number;
  maxAttempts: number;
  payloadSummary: string;
}): Promise<void> {
  const to = adminRecipients();
  if (!to.length || !resend) return;

  const subject = `[ForwardSlash] Job failed permanently: ${input.type}`;
  const text = [
    "A background job exhausted retries and was marked failed.",
    "",
    `Type: ${input.type}`,
    `Job ID: ${input.jobId}`,
    `Dedupe key: ${input.dedupeKey ?? "—"}`,
    `Attempts: ${input.attempts} / ${input.maxAttempts}`,
    `Payload: ${input.payloadSummary || "—"}`,
    "",
    "Last error:",
    input.lastError,
  ].join("\n");

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    text,
  });
}
