"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBanner } from "./AnnouncementBanner";

export const BANNER_EXCLUDED_PATHS = ["/dashboard", "/checkout"];

export function isBannerExcluded(pathname: string): boolean {
  return BANNER_EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const BANNER_HEIGHT_REM = 2.5; // ~40px, match banner min-height

export function AnnouncementBannerSitewide() {
  const pathname = usePathname() ?? "";
  if (isBannerExcluded(pathname)) return null;
  return (
    <>
      {/* Fixed to viewport top so it stays visible while scrolling (stacked above the liquid-glass header). */}
      <div className="fixed top-0 left-0 right-0 z-[60] min-h-[3.5rem] md:min-h-[2.5rem] flex items-center justify-center w-full bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm supports-[backdrop-filter]:bg-background/70">
        <AnnouncementBanner />
      </div>
      {/* Reserve space in document flow so page content starts below the banner */}
      <div className="min-h-[3.5rem] md:min-h-[2.5rem] shrink-0 w-full" aria-hidden />
    </>
  );
}
