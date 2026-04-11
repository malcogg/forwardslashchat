// ForwardSlash.Chat – AI chatbot builder
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forwardslash.chat";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ForwardSlash.Chat — AI Chatbot for Your Website",
    template: "%s | ForwardSlash.Chat",
  },
  description:
    "Get an AI chatbot trained on your site. One-time payment, hosting included. No monthly fees. From Starter ($129) to Pro. chat.yourdomain.com in minutes.",
  keywords: ["AI chatbot", "website chatbot", "one-time payment", "no monthly fees", "chat.yourdomain.com", "small business"],
  openGraph: {
    title: "ForwardSlash.Chat — AI Chatbot for Your Website",
    description: "One-time payment. Your own AI assistant. No monthly fees.",
    url: siteUrl,
    siteName: "ForwardSlash.Chat",
    images: ["/og-image.png"],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForwardSlash.Chat — AI Chatbot for Your Website",
    description: "One-time payment. Your own AI assistant. No monthly fees.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/** Valid-format test key used only when env is unset (e.g. `next build` in CI). Real deploys should set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. */
const CLERK_PUBLISHABLE_KEY_BUILD_PLACEHOLDER =
  "pk_test_Y2xlcmsucGxhY2Vob2xkZXIubG9jYWwk";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() || CLERK_PUBLISHABLE_KEY_BUILD_PLACEHOLDER;
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ParticlesBackground />
            {children}
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
