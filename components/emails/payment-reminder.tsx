import * as React from "react";

interface PaymentReminderProps {
  firstName?: string;
}

const CHECKOUT_URL = "https://forwardslash.chat/checkout?plan=chatbot";

export function PaymentReminderEmail({ firstName }: PaymentReminderProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Still want your AI chatbot?</h1>
      <p>
        {firstName ? `Hi ${firstName},` : "Hi,"}
      </p>
      <p>
        You signed up for ForwardSlash.Chat — your AI chatbot is one payment away.
      </p>
      <h2>What you get</h2>
      <ul>
        <li>Custom AI trained on your website</li>
        <li>Live at chat.yourdomain.com</li>
        <li>One-time payment, no monthly fees</li>
      </ul>
      <p>
        <a href={CHECKOUT_URL} style={{ color: "#059669", fontWeight: 600 }}>
          Complete your order →
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>
        Questions? Reply to this email.
      </p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
