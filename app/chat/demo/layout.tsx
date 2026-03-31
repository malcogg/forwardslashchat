import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo",
  description: "Try the ForwardSlash.Chat demo. Ask about pricing, AI chatbot, $350 starter site, or how it works.",
  openGraph: {
    title: "Demo | ForwardSlash.Chat",
    description: "Try our AI chatbot demo. Ask about pricing and how it works.",
  },
};

export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
