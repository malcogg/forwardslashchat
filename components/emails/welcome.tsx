import * as React from "react";

interface WelcomeEmailProps {
  firstName?: string;
}

export function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Welcome to ForwardSlash.Chat!</h1>
      <p>
        {firstName ? `Hi ${firstName},` : "Hi,"}
      </p>
      <p>
        Thanks for signing up. We&apos;re building custom AI chatbots for businesses — one upfront payment, no monthly fees.
      </p>
      <h2>Next steps</h2>
      <ul>
        <li>Go to your <a href="https://forwardslash.chat/dashboard">dashboard</a> and add your website URL</li>
        <li>Pay once to unlock the scan — we&apos;ll train your chatbot on your content</li>
        <li>Get your live chatbot at chat.yourdomain.com</li>
      </ul>
      <p>Questions? Reply to this email anytime.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
