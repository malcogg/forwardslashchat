import * as React from "react";

interface CrawlCompleteEmailProps {
  firstName?: string;
  businessName: string;
  domain: string;
  subdomain: string;
  websiteUrl: string;
  pagesCrawled: number;
  /** Live chat URL (e.g. https://forwardslash.chat/chat/c/[customerId]) once trained */
  chatUrl?: string;
}

const DASHBOARD_URL = "https://forwardslash.chat/dashboard";

export function CrawlCompleteEmail({
  firstName,
  businessName,
  domain,
  subdomain,
  websiteUrl,
  pagesCrawled,
  chatUrl: chatUrlProp,
}: CrawlCompleteEmailProps) {
  const cnameBlock = `Type: CNAME\nHost: ${subdomain}\nValue: cname.forwardslash.chat`;
  const chatUrl = chatUrlProp ?? `https://${subdomain}.${domain}`;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Your chatbot content is ready</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>We finished crawling <strong>{businessName}</strong>. Here&apos;s what we got:</p>
      <ul>
        <li><strong>Pages crawled:</strong> {pagesCrawled}</li>
        <li><strong>Website:</strong> {websiteUrl}</li>
        {chatUrlProp && (
          <li><strong>Try your chatbot:</strong> <a href={chatUrl} style={{ color: "#059669" }}>{chatUrl}</a></li>
        )}
      </ul>
      <h2>Next: Add your DNS</h2>
      <p>Add this CNAME record in your DNS provider (Cloudflare, GoDaddy, etc.):</p>
      <pre style={{ background: "#f4f4f4", padding: "12px", borderRadius: "6px", fontSize: "14px", overflow: "auto" }}>
        {cnameBlock}
      </pre>
      <p>
        <a href={DASHBOARD_URL} style={{ color: "#059669", fontWeight: 600 }}>
          Go to dashboard →
        </a>
      </p>
      <p style={{ marginTop: "16px" }}>Got more sites? Add them in your dashboard and pay once to unlock your full bundle.</p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
