import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

/**
 * POST /api/webhooks/resend
 * Resend webhook for email.received (inbound emails to hello@forwardslash.chat).
 *
 * Set up in Resend: Webhooks → Add → event: email.received
 * URL: https://forwardslash.chat/api/webhooks/resend
 * Add RESEND_WEBHOOK_SECRET to env (from webhook details page).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET not configured" },
      { status: 503 }
    );
  }

  const payload = await req.text();
  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  try {
    const wh = new Webhook(secret);
    const event = wh.verify(payload, {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    }) as {
      type: string;
      data?: {
        email_id?: string;
        from?: string;
        to?: string[];
        subject?: string;
        created_at?: string;
      };
    };

    if (event.type === "email.received") {
      const { from, to, subject, email_id } = event.data ?? {};
      // TODO: Process inbound email (e.g. store, notify, auto-reply)
      // Webhook payload only has metadata; use Resend API to fetch full content/attachments
      console.info("[resend] Email received:", { from, to, subject, email_id });
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Resend webhook verification error:", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
}
