import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </Link>
      </div>
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <UserProfile
          path="/user-profile"
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-sm border border-border",
            },
          }}
        />
      </div>
    </main>
  );
}
