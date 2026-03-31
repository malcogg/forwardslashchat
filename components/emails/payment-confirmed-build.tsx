import * as React from "react";

interface PaymentConfirmedBuildProps {
  firstName?: string;
  businessName?: string;
}

const DASHBOARD_URL = "https://forwardslash.chat/dashboard";

export function PaymentConfirmedBuildEmail({ firstName, businessName }: PaymentConfirmedBuildProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Payment confirmed – build your chatbot</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>
        Your payment was received. You&apos;re all set to build your AI chatbot
        {businessName ? <> for <strong>{businessName}</strong></> : ""}.
      </p>
      <h2>Next step</h2>
      <p>
        Go to your dashboard and click <strong>Build my chatbot</strong>. We&apos;ll crawl your site,
        train the AI on your content, and get your chat page ready.
      </p>
      <p>
        <a href={DASHBOARD_URL} style={{ color: "#059669", fontWeight: 600 }}>
          Open dashboard →
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
