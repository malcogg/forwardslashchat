import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { WelcomeEmail } from "@/components/emails/welcome";

/**
 * POST /api/webhooks/clerk
 * Clerk webhook: user.created, user.updated, user.deleted.
 * Sends welcome email on user.created.
 *
 * Set up in Clerk Dashboard: Webhooks → Add endpoint → URL: https://forwardslash.chat/api/webhooks/clerk
 * Subscribe to: user.created
 * Add CLERK_WEBHOOK_SIGNING_SECRET to env vars.
 */
export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type === "user.created") {
      const user = evt.data;
      const email = user.email_addresses?.[0]?.email_address;
      const firstName = user.first_name ?? undefined;

      if (email) {
        if (!resend) {
          console.warn("Welcome email skipped: RESEND_API_KEY not set");
        } else {
          const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [email],
            subject: "Welcome to ForwardSlash.Chat",
            react: WelcomeEmail({ firstName: firstName ?? undefined }),
          });

          if (error) {
            console.error("Welcome email failed:", error);
            return NextResponse.json(
              { error: "Welcome email failed" },
              { status: 500 }
            );
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json(
      { error: "Webhook verification failed" },
      { status: 400 }
    );
  }
}
