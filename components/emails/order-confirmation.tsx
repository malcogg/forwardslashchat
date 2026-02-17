import * as React from "react";

interface OrderConfirmationProps {
  businessName: string;
  planName: string;
  total: string;
  websiteUrl?: string;
  domain?: string;
}

export function OrderConfirmationEmail({
  businessName,
  planName,
  total,
  websiteUrl,
  domain,
}: OrderConfirmationProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Thanks for your order, {businessName}!</h1>
      <p>We received your payment for <strong>{planName}</strong> — {total} one-time.</p>
      {domain && <p><strong>Domain:</strong> {domain}</p>}
      {websiteUrl && <p><strong>Website:</strong> {websiteUrl}</p>}
      <h2>Next steps</h2>
      <ul>
        <li>We&apos;ll reach out if we need anything else.</li>
        <li>Check your dashboard at forwardslash.chat/dashboard for status updates.</li>
        <li>Questions? Reply to this email or book a call.</li>
      </ul>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
