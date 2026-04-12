import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userOnboarding, users } from "@/db/schema";
import { isOnboardingCompleteForApp } from "@/lib/onboarding-version";

export const metadata: Metadata = {
  title: "Dashboard | ForwardSlash.Chat",
  description: "Manage your AI chatbot",
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (userId && db) {
    const [user] = await db.select().from(users).where(eq(users.externalId, userId));
    if (user) {
      const [row] = await db
        .select({
          completedAt: userOnboarding.completedAt,
          extra: userOnboarding.extra,
        })
        .from(userOnboarding)
        .where(eq(userOnboarding.userId, user.id));
      if (!isOnboardingCompleteForApp(row, row?.extra)) {
        redirect("/onboarding");
      }
    }
  }
  return children;
}
