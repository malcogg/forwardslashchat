import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | ForwardSlash.Chat",
  description: "Manage your AI chatbot",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
