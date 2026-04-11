import Link from "next/link";
import fs from "node:fs/promises";
import path from "node:path";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), "docs/legal/PRIVACY-POLICY.md");
  const content = await fs.readFile(filePath, "utf8");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <LegalMarkdown content={content} />
      </main>
    </div>
  );
}
