"use client";

import Link from "next/link";
import { Plus, PanelLeftClose, PanelLeft, Menu, Sun, Moon } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { useTheme } from "next-themes";

interface AppSidebarProps {
  onScanClick: () => void;
  scannedSites: string[];
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onSiteClick?: (url: string) => void;
}

function SidebarContent({
  onScanClick,
  scannedSites,
  onCloseMobile,
  onSiteClick,
}: {
  onScanClick: () => void;
  scannedSites: string[];
  onCloseMobile?: () => void;
  onSiteClick?: (url: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-4 border-b border-sidebar-border">
        <span className="text-base font-semibold text-sidebar-foreground">Chatbot</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onScanClick}
            className="p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label="New scan"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-1">
          <Link
            href="/chat/demo"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm w-full text-left"
          >
            Demo
          </Link>
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm w-full text-left"
          >
            Dashboard
          </Link>
          {scannedSites.map((site) => (
            <button
              key={site}
              type="button"
              onClick={() => {
                onSiteClick?.(site);
                onCloseMobile?.();
              }}
              className="w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm text-left truncate"
              title={site}
            >
              {site.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </button>
          ))}
        </div>
        {scannedSites.length === 0 && (
          <p className="px-3 text-xs text-muted-foreground mt-4">Scan a website to add it here</p>
        )}
      </div>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <ThemeToggle />
        <SignedIn>
          <div className="flex items-center gap-2 px-3 py-2">
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground">Guest</p>
              <SignInButton mode="modal">
                <button className="text-xs text-muted-foreground hover:text-foreground underline">
                  Sign in
                </button>
              </SignInButton>
              <span className="text-muted-foreground mx-1">/</span>
              <SignUpButton mode="modal">
                <button className="text-xs text-muted-foreground hover:text-foreground underline">
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </div>
        </SignedOut>
      </div>
    </>
  );
}

export function AppSidebar({ onScanClick, scannedSites, sidebarOpen, onSidebarToggle, onSiteClick }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
          sidebarOpen ? "md:w-60" : "md:w-0 md:overflow-hidden"
        }`}
      >
        {sidebarOpen && <SidebarContent onScanClick={onScanClick} scannedSites={scannedSites} onSiteClick={onSiteClick} />}
      </aside>

      {/* Mobile: menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-sidebar/95 backdrop-blur border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-sidebar-foreground">ForwardSlash.Chat</span>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
              <span className="text-base font-semibold text-sidebar-foreground">Chatbot</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                ×
              </button>
            </div>
            <SidebarContent
              onScanClick={() => {
                onScanClick();
                setMobileOpen(false);
              }}
              scannedSites={scannedSites}
              onSiteClick={onSiteClick}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm w-full"
      title="Toggle dark mode"
    >
      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      Toggle dark mode
    </button>
  );
}

export function SidebarToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title="Toggle Sidebar"
      className="hidden md:flex items-center justify-center w-9 h-9 rounded-r-lg bg-muted border border-l-0 border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      aria-label="Toggle Sidebar"
    >
      {open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
    </button>
  );
}
