/** Sidebar structure for /help (GitBook-style help center). */

export type HelpNavItem = {
  title: string;
  href: string;
};

export type HelpNavSection = {
  title: string;
  items: HelpNavItem[];
};

export const helpNavSections: HelpNavSection[] = [
  {
    title: "Help center",
    items: [{ title: "Welcome", href: "/help" }],
  },
  {
    title: "DNS & chat subdomain",
    items: [
      { title: "Overview & concepts", href: "/help/dns" },
      { title: "Namecheap", href: "/help/dns/namecheap" },
      { title: "Namecheap + Cloudflare", href: "/help/dns/namecheap-cloudflare" },
      { title: "Cloudflare (DNS only)", href: "/help/dns/cloudflare" },
      { title: "GoDaddy", href: "/help/dns/godaddy" },
      { title: "Google / Squarespace Domains", href: "/help/dns/google-squarespace" },
      { title: "AWS Route 53", href: "/help/dns/aws-route53" },
      { title: "Porkbun", href: "/help/dns/porkbun" },
      { title: "IONOS", href: "/help/dns/ionos" },
      { title: "DreamHost", href: "/help/dns/dreamhost" },
      { title: "Bluehost", href: "/help/dns/bluehost" },
      { title: "Wix", href: "/help/dns/wix" },
      { title: "Shopify domain", href: "/help/dns/shopify" },
      { title: "Network Solutions", href: "/help/dns/network-solutions" },
      { title: "Other / any provider", href: "/help/dns/generic" },
    ],
  },
];

/** Slugs for `app/help/dns/[provider]/page.tsx` (excludes `/help/dns` overview). */
export const helpDnsGuideSlugs = [
  "namecheap",
  "namecheap-cloudflare",
  "cloudflare",
  "godaddy",
  "google-squarespace",
  "aws-route53",
  "porkbun",
  "ionos",
  "dreamhost",
  "bluehost",
  "wix",
  "shopify",
  "network-solutions",
  "generic",
] as const;

export type HelpDnsGuideSlug = (typeof helpDnsGuideSlugs)[number];

export function isHelpDnsGuideSlug(s: string): s is HelpDnsGuideSlug {
  return (helpDnsGuideSlugs as readonly string[]).includes(s);
}
