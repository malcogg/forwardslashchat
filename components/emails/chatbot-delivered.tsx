import * as React from "react";

interface ChatbotDeliveredEmailProps {
  firstName?: string;
  businessName: string;
  chatUrl: string;
}

export function ChatbotDeliveredEmail({
  firstName,
  businessName,
  chatUrl,
}: ChatbotDeliveredEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Your chatbot is live</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>Your chatbot for <strong>{businessName}</strong> is live. Share it with your customers.</p>
      <p>
        <a href={chatUrl} style={{ color: "#059669", fontWeight: 600 }}>
          Open your chatbot →
        </a>
      </p>
      <p style={{ color: "#374151", fontSize: "14px", wordBreak: "break-all" }}>
        Your link:{" "}
        <a href={chatUrl} style={{ color: "#059669" }}>
          {chatUrl}
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Bookmark this URL for your team. Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
