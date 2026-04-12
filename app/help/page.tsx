import Link from "next/link";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";

const content = `
# Help center

Welcome to the ForwardSlash.Chat help center. These guides help you connect your **chat subdomain** (for example \`chat.yourdomain.com\`) so visitors can use your AI chatbot on your own domain.

## Popular topics

- **[DNS overview](/help/dns)** — How CNAME records work, what “nameservers” mean, and common mistakes  
- **[Namecheap + Cloudflare](/help/dns/namecheap-cloudflare)** — If your domain uses Cloudflare for DNS  
- **[Cloudflare only](/help/dns/cloudflare)** — All records in Cloudflare  
- **[GoDaddy](/help/dns/godaddy)**  
- **[Other providers](/help/dns/generic)** — Works for any DNS host  

## What you’re setting up

After your site is crawled and trained, the dashboard asks you to add a **CNAME** record so **\`chat.\`** points to our hosting (typically **\`cname.vercel-dns.com\`**, unless your project uses a custom CNAME target).

Then use **Go live** in the dashboard so we can verify DNS and attach your domain.

## Need more help?

Use the guides in the sidebar. If something still fails, confirm the CNAME at your DNS provider matches the value shown in your ForwardSlash dashboard email or go-live screen.
`;

export default function HelpHomePage() {
  return (
    <div>
      <LegalMarkdown content={content} />
      <p className="mt-10 text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary underline underline-offset-2">
          Open your dashboard
        </Link>
      </p>
    </div>
  );
}
