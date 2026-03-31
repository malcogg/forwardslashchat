import * as React from "react";

interface PaymentReminderFollowUpProps {
  firstName?: string;
  /** 2 = day 7, 3 = day 14 */
  step: 2 | 3;
}

const CHECKOUT_URL = "https://forwardslash.chat/checkout?plan=chatbot-2y&pages=25";

const STEP_CONTENT = {
  2: {
    headline: "Your AI chatbot is still waiting",
    intro: "You signed up a week ago — we wanted to check in. Your custom chatbot is one payment away.",
  },
  3: {
    headline: "Last chance to get started",
    intro: "We noticed you haven't started yet. Get your AI chatbot trained on your site for a one-time payment — no monthly fees.",
  },
} as const;

export function PaymentReminderFollowUpEmail({ firstName, step }: PaymentReminderFollowUpProps) {
  const { headline, intro } = STEP_CONTENT[step];

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>{headline}</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>{intro}</p>
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
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
