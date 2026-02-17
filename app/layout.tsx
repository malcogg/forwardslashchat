import type { Metadata } from "next";
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
  title: "ForwardSlash.Chat - AI Chatbot for Your Website",
  description: "One-time payment. Your own AI assistant. No monthly fees.",
  openGraph: {
    title: "ForwardSlash.Chat - AI Chatbot for Your Website",
    description: "One-time payment. Your own AI assistant. No monthly fees.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForwardSlash.Chat - AI Chatbot for Your Website",
    description: "One-time payment. Your own AI assistant. No monthly fees.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Clerk publishableKey - must be set in Vercel env vars for deploy
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
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
