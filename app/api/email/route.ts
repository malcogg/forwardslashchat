import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { OrderConfirmationEmail } from "@/components/emails/order-confirmation";

/**
 * POST /api/email
 * Send order confirmation or other transactional emails via Resend.
 * Body: { type, to, ...payload }
 */
export async function POST(request: Request) {
  if (!resend) {
    return NextResponse.json(
      { error: "Email not configured. Add RESEND_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { type, to } = body as { type: string; to: string; [key: string]: unknown };

    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "`to` email is required" }, { status: 400 });
    }

    if (type === "order-confirmation") {
      const { businessName, planName, total, websiteUrl, domain } = body;
      if (!businessName || !planName || !total) {
        return NextResponse.json(
          { error: "order-confirmation requires businessName, planName, total" },
          { status: 400 }
        );
      }

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject: `Order confirmed — ${planName}`,
        react: OrderConfirmationEmail({
          businessName,
          planName,
          total: String(total),
          websiteUrl: websiteUrl ?? undefined,
          domain: domain ?? undefined,
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
