import { OrderConfirmationEmail } from "@/components/emails/order-confirmation";
import { planNameFromSlug, type CheckoutPlanSlug } from "@/lib/checkout-pricing";
import { FROM_EMAIL, resend } from "@/lib/resend";

function planLabel(planSlug: string | null): string {
  if (!planSlug) return "Your purchase";
  const name = planNameFromSlug(planSlug as CheckoutPlanSlug);
  return name || planSlug;
}

/**
 * Branded “payment received” after Stripe checkout (in addition to Stripe’s own receipt).
 * Disable with `SKIP_PAYMENT_RECEIVED_EMAIL=1` or if Resend is not configured.
 */
export async function sendPaymentReceivedEmail(input: {
  to: string;
  businessName: string;
  planSlug: string | null;
  amountCents: number;
  websiteUrl?: string | null;
  domain?: string | null;
}): Promise<void> {
  if (!resend) return;
  const skip = process.env.SKIP_PAYMENT_RECEIVED_EMAIL;
  if (skip === "1" || skip === "true") return;

  const total = `$${(input.amountCents / 100).toFixed(2)}`;
  const planName = planLabel(input.planSlug);

  await resend.emails.send({
    from: FROM_EMAIL,
    to: [input.to.trim().toLowerCase()],
    subject: "Payment received — ForwardSlash.Chat",
    react: OrderConfirmationEmail({
      businessName: input.businessName,
      planName,
      total,
      websiteUrl: input.websiteUrl ?? undefined,
      domain: input.domain ?? undefined,
    }),
  });
}
