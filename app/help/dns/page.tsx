import fs from "node:fs/promises";
import path from "node:path";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";

export default async function HelpDnsOverviewPage() {
  const filePath = path.join(process.cwd(), "docs/help/dns-overview.md");
  const content = await fs.readFile(filePath, "utf8");

  return <LegalMarkdown content={content} />;
}
