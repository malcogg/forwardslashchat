"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, Menu, X, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function getInitials(user: { firstName?: string | null; lastName?: string | null; fullName?: string | null } | null | undefined) {
  if (!user) return "?";
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.fullName) return user.fullName.slice(0, 2).toUpperCase();
  return "?";
}

/** Signed-in: profile circle with dropdown (Dashboard, Sign out, Services, How it works) */
function ProfileMenuSignedIn() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const initials = getInitials(user);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Profile menu"
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 py-1 backdrop-blur-xl bg-background/95 dark:bg-background/95 border border-border/60 rounded-lg shadow-xl z-[100]">
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/services"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Services
          </Link>
          <a
            href="/#how-it-works"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            How it works
          </a>
          <button
            onClick={() => {
              close();
              signOut({ redirectUrl: "/" });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** Signed-out mobile: hamburger with drawer (Sign up, How it works, Services, Demo) */
const guestNavLinks = [
  { href: "/sign-up", label: "Sign up", cta: true },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/services", label: "Services" },
  { href: "/chat/demo", label: "Demo" },
];

const desktopNavLinks = [
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/chat/demo", label: "Demo" },
];

type LastScan = { url: string; displayUrl: string };

export function Header({
  lastScan = null,
  onOpenLastScan,
}: {
  lastScan?: LastScan | null;
  onOpenLastScan?: (url: string) => void;
} = {}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [bellOpen]);

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-[55] w-full backdrop-blur-xl bg-background/70 dark:bg-background/80 border-b border-border/40 shadow-sm"
      >
        <div className="w-full py-3 px-4 sm:py-4 sm:px-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-foreground lowercase shrink-0">
            forwardslash.chat
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            {desktopNavLinks.map(({ href, label }) =>
              href.startsWith("/") && !href.startsWith("/#") ? (
                <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </Link>
              ) : (
                <a key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </a>
              )
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {lastScan && onOpenLastScan && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-foreground"
                  aria-label="Your last scan"
                  type="button"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-medium text-white">
                    1
                  </span>
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 py-1 backdrop-blur-xl bg-background/95 dark:bg-background/95 border border-border/60 rounded-lg shadow-xl z-[100]">
                    <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border/60">
                      Your last scan
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLastScan(lastScan.url);
                        setBellOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                    >
                      <span className="truncate">{lastScan.displayUrl}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            <ThemeToggle />
            <SignedOut>
              <Link href="/sign-in" className="hidden md:inline-block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/sign-up" className="hidden md:inline-block">
                <Button variant="cta" size="sm">
                  Get started
                </Button>
              </Link>
              {/* Mobile: hamburger only when signed out */}
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-foreground touch-manipulation min-w-[36px] min-h-[36px]"
                aria-label="Open menu"
                type="button"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SignedOut>
            <SignedIn>
              <ProfileMenuSignedIn />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Mobile bottom sheet for signed-out users */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
              onKeyDown={(e) => e.key === "Escape" && setMobileDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-background border-t border-border shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-4 flex items-center justify-between border-b border-border shrink-0">
                <span className="font-bold text-foreground text-lg">Menu</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground touch-manipulation"
                  aria-label="Close menu"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 flex flex-col gap-1 overflow-auto">
                {guestNavLinks.map(({ href, label, cta }) =>
                  href.startsWith("/") && !href.startsWith("/#") ? (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`py-4 px-4 rounded-xl text-foreground hover:bg-accent active:bg-accent transition-colors block text-base touch-manipulation ${
                        cta ? "font-semibold" : ""
                      }`}
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      key={href}
                      href={href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="py-4 px-4 rounded-xl text-foreground hover:bg-accent active:bg-accent transition-colors block text-base touch-manipulation"
                    >
                      {label}
                    </a>
                  )
                )}
              </nav>
              <div className="p-4 border-t border-border shrink-0 safe-area-pb">
                <Link href="/sign-up" onClick={() => setMobileDrawerOpen(false)} className="block">
                  <Button variant="cta" size="lg" className="w-full py-6 text-base">
                    Get started
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Spacer = navbar height only; announcement bar reserves its own height in layout (fixed + flow spacer). */}
      <div className="shrink-0 h-14 md:h-16 transition-[height] duration-200" aria-hidden />
    </>
  );
}
