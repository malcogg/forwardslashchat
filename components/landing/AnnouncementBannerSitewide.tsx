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
    <div className="sticky top-0 z-[60] min-h-[3.5rem] md:min-h-[2.5rem] flex items-center justify-center shrink-0 w-full">
      <AnnouncementBanner />
    </div>
  );
}
