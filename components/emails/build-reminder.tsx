import * as React from "react";

interface BuildReminderProps {
  firstName?: string;
  businessName: string;
}

const DASHBOARD_URL = "https://forwardslash.chat/dashboard";

export function BuildReminderEmail({ firstName, businessName }: BuildReminderProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Build your bot to get started</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>
        You paid for your AI chatbot a few days ago, but we haven&apos;t trained it on your site yet.
        {businessName && (
          <> Get <strong>{businessName}</strong> live in a few minutes. </>
        )}
      </p>
      <p>
        Go to your dashboard and click <strong>Build my chatbot</strong>. We&apos;ll crawl your website
        and your chat will be ready to go.
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
