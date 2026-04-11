import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up your workspace | ForwardSlash.Chat",
  description: "A few quick questions so we can tailor your dashboard.",
};

export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-white antialiased">{children}</div>;
}
