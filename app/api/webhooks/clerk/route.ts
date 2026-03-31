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
      const user = evt.data as {
        email_addresses?: { id: string; email_address: string }[];
        primary_email_address_id?: string;
        first_name?: string | null;
        external_accounts?: { email_address?: string; emailAddress?: string }[];
      };
      // Prefer primary email; fallback to first in array (OAuth/Google populates this)
      let email = user.email_addresses?.find(
        (e) => e.id === user.primary_email_address_id
      )?.email_address;
      if (!email && user.email_addresses?.length) {
        email = user.email_addresses[0].email_address;
      }
      // OAuth providers put email in external_accounts (emailAddress or email_address)
      if (!email && user.external_accounts?.length) {
        const ext = user.external_accounts[0];
        email = ext.emailAddress ?? ext.email_address;
      }
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
