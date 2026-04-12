import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import { isHelpDnsGuideSlug } from "@/lib/help-nav";

type Props = { params: Promise<{ provider: string }> };

export default async function HelpDnsProviderPage({ params }: Props) {
  const { provider } = await params;
  if (!isHelpDnsGuideSlug(provider)) {
    notFound();
  }

  const filePath = path.join(process.cwd(), "docs/help/dns", `${provider}.md`);
  let content: string;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    notFound();
  }

  return <LegalMarkdown content={content} />;
}
