import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { OrderConfirmationEmail } from "@/components/emails/order-confirmation";
import { WelcomeEmail } from "@/components/emails/welcome";
import { PaymentReminderEmail } from "@/components/emails/payment-reminder";
import {
  isValidEmail,
  sanitizeFirstName,
  sanitizeBusinessName,
  sanitizeGenericText,
  LIMITS,
} from "@/lib/validation";

/**
 * POST /api/email
 * Send order confirmation, welcome, or other transactional emails via Resend.
 * Requires Authorization: Bearer EMAIL_API_SECRET (internal/cron only).
 * Body: { type, to, ...payload }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.EMAIL_API_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Email API not configured. Add EMAIL_API_SECRET." },
      { status: 503 }
    );
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json(
      { error: "Email not configured. Add RESEND_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { type, to } = body as { type: string; to: string; [key: string]: unknown };

    if (!to || typeof to !== "string" || !isValidEmail(to)) {
      return NextResponse.json({ error: "Valid `to` email is required" }, { status: 400 });
    }

    const safeTo = to.trim().toLowerCase().slice(0, LIMITS.email);

    if (type === "welcome") {
      const { firstName } = body;
      const safeFirstName = typeof firstName === "string" ? sanitizeFirstName(firstName) : undefined;
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [safeTo],
        subject: "Welcome to ForwardSlash.Chat",
        react: WelcomeEmail({ firstName: safeFirstName }),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    if (type === "payment-reminder") {
      const { firstName } = body;
      const safeFirstName = typeof firstName === "string" ? sanitizeFirstName(firstName) : undefined;
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [safeTo],
        subject: "Still want your AI chatbot?",
        react: PaymentReminderEmail({ firstName: safeFirstName }),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    if (type === "order-confirmation") {
      const { businessName, planName, total, websiteUrl, domain } = body;
      if (
        typeof businessName !== "string" ||
        typeof planName !== "string" ||
        total == null
      ) {
        return NextResponse.json(
          { error: "order-confirmation requires businessName, planName, total" },
          { status: 400 }
        );
      }

      const safeBusinessName = sanitizeBusinessName(businessName);
      const safePlanName = sanitizeGenericText(planName, 100);
      const safeTotal = String(total).slice(0, 50);

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [safeTo],
        subject: `Order confirmed — ${safePlanName}`,
        react: OrderConfirmationEmail({
          businessName: safeBusinessName,
          planName: safePlanName,
          total: safeTotal,
          websiteUrl: typeof websiteUrl === "string" ? sanitizeGenericText(websiteUrl, LIMITS.websiteUrl) : undefined,
          domain: typeof domain === "string" ? sanitizeGenericText(domain, LIMITS.domain) : undefined,
        }),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });
  } catch (e) {
    console.error("Email error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Email failed" },
      { status: 500 }
    );
  }
}
