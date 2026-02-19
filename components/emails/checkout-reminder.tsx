import * as React from "react";

interface CheckoutReminderEmailProps {
  firstName?: string;
}

const CHECKOUT_URL = "https://forwardslash.chat/checkout?plan=chatbot-2y&pages=25";

export function CheckoutReminderEmail({ firstName }: CheckoutReminderEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Finish your AI chatbot order</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>You visited our checkout — your custom AI chatbot is one payment away.</p>
      <p>
        <a href={CHECKOUT_URL} style={{ color: "#059669", fontWeight: 600 }}>
          Complete your order →
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
