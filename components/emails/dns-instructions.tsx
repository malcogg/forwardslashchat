import * as React from "react";

interface DnsInstructionsEmailProps {
  firstName?: string;
  businessName: string;
  domain: string;
  subdomain: string;
}

const DASHBOARD_URL = "https://forwardslash.chat/dashboard";

export function DnsInstructionsEmail({
  firstName,
  businessName,
  domain,
  subdomain,
}: DnsInstructionsEmailProps) {
  const cnameTarget = process.env.CNAME_TARGET ?? "cname.vercel-dns.com";
  const cnameBlock = `Type: CNAME\nHost: ${subdomain}\nValue: ${cnameTarget}`;

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Add this CNAME to go live</h1>
      <p>{firstName ? `Hi ${firstName},` : "Hi,"}</p>
      <p>Your chatbot for <strong>{businessName}</strong> is ready. Add this record to your DNS:</p>
      <pre style={{ background: "#f4f4f4", padding: "12px", borderRadius: "6px", fontSize: "14px", overflow: "auto" }}>
        {cnameBlock}
      </pre>
      <p>
        <a href="https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-cname-record/" style={{ color: "#059669" }}>Cloudflare guide</a>
        {" · "}
        <a href="https://www.godaddy.com/help/add-a-cname-record-19236" style={{ color: "#059669" }}>GoDaddy guide</a>
      </p>
      <p>Then click &quot;I&apos;ve added my DNS&quot; in your dashboard.</p>
      <p>
        <a href={DASHBOARD_URL} style={{ color: "#059669", fontWeight: 600 }}>
          Go to dashboard →
        </a>
      </p>
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Questions? Reply to this email.</p>
      <p>— The ForwardSlash.Chat team</p>
    </div>
  );
}
