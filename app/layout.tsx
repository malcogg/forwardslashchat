import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ForwardSlash.Chat - AI Chatbot for Your Website",
  description: "One-time payment. Your own AI assistant. No monthly fees.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
