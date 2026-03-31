import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Website + AI chatbot packages: Quick WordPress Starter ($350), Brand New Build ($1,000), Redesign ($2,000). One-time payment, year 1 hosting included. Florida-focused.",
  openGraph: {
    title: "Services | ForwardSlash.Chat",
    description: "Website + AI chatbot packages. One-time payment, year 1 hosting included.",
  },
};

export default function ServicesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
