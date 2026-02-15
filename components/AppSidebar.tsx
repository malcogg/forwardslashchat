"use client";

import Link from "next/link";
import { Plus, PanelLeftClose, PanelLeft, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  onScanClick: () => void;
  scannedSites: string[];
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

function SidebarContent({
  onScanClick,
  scannedSites,
  onCloseMobile,
}: {
  onScanClick: () => void;
  scannedSites: string[];
  onCloseMobile?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-4 border-b border-zinc-800/50">
        <span className="text-base font-semibold text-white">Chatbot</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onScanClick}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-sm w-full text-left"
          >
            Demo
          </Link>
          {scannedSites.map((site) => (
            <div
              key={site}
              className="px-3 py-2 rounded-lg text-zinc-400 text-sm truncate"
              title={site}
            >
              {site.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </div>
          ))}
        </div>
        {scannedSites.length === 0 && (
          <p className="px-3 text-xs text-zinc-500 mt-4">Scan a website to add it here</p>
        )}
      </div>
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Guest</p>
            <button className="text-xs text-zinc-400 hover:text-zinc-300 underline">
              Login to your account
            </button>
            <span className="text-zinc-500 mx-1">/</span>
            <button className="text-xs text-zinc-400 hover:text-zinc-300 underline">
              Sign up
            </button>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        </div>
      </div>
    </>
  );
}

export function AppSidebar({ onScanClick, scannedSites, sidebarOpen, onSidebarToggle }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-zinc-950 border-r border-zinc-800/50 transition-all duration-200 ${
          sidebarOpen ? "md:w-60" : "md:w-0 md:overflow-hidden"
        }`}
      >
        {sidebarOpen && <SidebarContent onScanClick={onScanClick} scannedSites={scannedSites} />}
      </aside>

      {/* Mobile: menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white">ForwardSlash.Chat</span>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <span className="text-base font-semibold text-white">Chatbot</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
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
              onCloseMobile={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

    </>
  );
}

export function SidebarToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title="Toggle Sidebar"
      className="hidden md:flex items-center justify-center w-9 h-9 rounded-r-lg bg-zinc-800/80 border border-l-0 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
      aria-label="Toggle Sidebar"
    >
      {open ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
    </button>
  );
}
