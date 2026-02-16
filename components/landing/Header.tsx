"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, useUser, SignOutButton } from "@clerk/nextjs";
import { LayoutDashboard, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

function getInitials(user: { firstName?: string | null; lastName?: string | null; fullName?: string | null } | null | undefined) {
  if (!user) return "?";
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.fullName) return user.fullName.slice(0, 2).toUpperCase();
  return "?";
}

function ProfileMenu() {
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
        <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-popover border border-border rounded-lg shadow-lg z-50">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <SignOutButton redirectUrl="/">
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}

export function Header() {
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between max-w-7xl mx-auto">
      <Link href="/" className="text-xl font-bold text-foreground lowercase shrink-0">
        forwardslash.chat
      </Link>
      <nav className="hidden md:flex items-center justify-center gap-8 flex-1">
        <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          How it works
        </a>
        <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Pricing
        </a>
        <Link href="/chat/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Demo
        </Link>
      </nav>
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />
        <SignedOut>
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              Get started
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <ProfileMenu />
        </SignedIn>
      </div>
    </header>
  );
}
