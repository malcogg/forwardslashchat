import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thanks for your order. Create an account to track your order and get your chatbot live.",
  robots: { index: false, follow: true },
};

export default function ThankYouLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
