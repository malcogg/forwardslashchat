"use client";

import Link from "next/link";
import { Plus, HelpCircle, DollarSign, Info, Play, LayoutDashboard, Menu } from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  onScanClick: () => void;
  onInfoClick: (id: "how" | "pricing" | "about" | "demo") => void;
}

const INFO_ITEMS = [
  { id: "how" as const, label: "How it works", icon: HelpCircle },
  { id: "pricing" as const, label: "Pricing", icon: DollarSign },
  { id: "about" as const, label: "About", icon: Info },
  { id: "demo" as const, label: "Demo", icon: Play },
];

function SidebarContent({ onScanClick, onInfoClick }: { onScanClick: () => void; onInfoClick: (id: "how" | "pricing" | "about" | "demo") => void }) {
  return (
    <>
      <div className="p-3 flex flex-col gap-1">
        <button
          onClick={onScanClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-sm font-medium w-full"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Scan Website
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <div className="py-2">
          <p className="px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Info</p>
          {INFO_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onInfoClick(id)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors text-sm w-full"
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 border-t border-zinc-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors text-sm w-full"
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </Link>
      </div>
    </>
  );
}

export function AppSidebar({ onScanClick, onInfoClick }: AppSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-zinc-950 border-r border-zinc-800/50">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-zinc-800/50">
          <span className="text-base font-semibold text-white">ForwardSlash.Chat</span>
        </div>
        <SidebarContent onScanClick={onScanClick} onInfoClick={onInfoClick} />
      </aside>

      {/* Mobile: menu button + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-white">ForwardSlash.Chat</span>
        <div className="w-10" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
              <span className="text-base font-semibold text-white">ForwardSlash.Chat</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>
            <SidebarContent
              onScanClick={() => {
                onScanClick();
                setSidebarOpen(false);
              }}
              onInfoClick={(id) => {
                onInfoClick(id);
                setSidebarOpen(false);
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
