"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, useUser, useClerk } from "@clerk/nextjs";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Drawer } from "vaul";

function getInitials(user: { firstName?: string | null; lastName?: string | null; fullName?: string | null } | null | undefined) {
  if (!user) return "?";
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.fullName) return user.fullName.slice(0, 2).toUpperCase();
  return "?";
}

function ProfileMenuWithSignOut() {
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
        <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-popover border border-border rounded-lg shadow-lg z-[100]">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={() => {
              setOpen(false);
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

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/chat/demo", label: "Demo" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Fixed liquid glass navbar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl bg-background/70 dark:bg-background/80 border-b border-border/40 shadow-sm"
      >
        <div className="w-full py-4 px-6 flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-foreground lowercase shrink-0">
            forwardslash.chat
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
            {navLinks.map(({ href, label }) =>
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
            <ThemeToggle />
            <SignedOut>
              <Link href="/sign-in" className="hidden md:inline-block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/sign-up" className="hidden md:inline-block">
                <Button size="sm" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="hidden md:block">
                <ProfileMenuWithSignOut />
              </div>
              {/* Mobile: show profile circle with dropdown when signed in */}
              <div className="md:hidden">
                <ProfileMenuWithSignOut />
              </div>
            </SignedIn>

            {/* Mobile hamburger - nav links only (shown when signed out; when signed in we still need nav so show both) */}
            <Drawer.Root
              direction="right"
              open={mobileOpen}
              onOpenChange={setMobileOpen}
            >
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-accent text-foreground touch-manipulation"
                aria-label="Open menu"
                type="button"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Drawer.Portal>
                <Drawer.Overlay
                  className="bg-black/40 backdrop-blur-sm"
                  onClick={() => setMobileOpen(false)}
                />
                <Drawer.Content
                  className="w-[280px] max-w-[85vw] h-full bg-background border-l border-border flex flex-col z-[60]"
                  onEscapeKeyDown={() => setMobileOpen(false)}
                >
                  <div className="p-6 flex items-center justify-between border-b border-border">
                    <span className="font-bold text-foreground">Menu</span>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground touch-manipulation"
                      aria-label="Close menu"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <nav className="flex-1 p-6 flex flex-col gap-1 overflow-auto">
                    {navLinks.map(({ href, label }) =>
                      href.startsWith("/") && !href.startsWith("/#") ? (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className="py-3 px-4 rounded-lg text-foreground hover:bg-accent transition-colors"
                        >
                          {label}
                        </Link>
                      ) : (
                        <a
                          key={href}
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className="py-3 px-4 rounded-lg text-foreground hover:bg-accent transition-colors block"
                        >
                          {label}
                        </a>
                      )
                    )}
                  </nav>
                  {/* Auth section only when signed out - when signed in, profile dropdown handles it */}
                  <SignedOut>
                    <div className="p-6 border-t border-border space-y-3">
                      <Link
                        href="/sign-in"
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button variant="ghost" size="sm" className="w-full justify-center">Sign in</Button>
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button size="sm" className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          Get started
                        </Button>
                      </Link>
                    </div>
                  </SignedOut>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </div>
      </header>
      {/* Spacer so content is not hidden under fixed header */}
      <div className="h-16 shrink-0" aria-hidden />
    </>
  );
}
