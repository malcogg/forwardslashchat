"use client";

import { LayoutDashboard, PlusCircle, User } from "lucide-react";
import type { MobileScreen } from "./mobile-types";

type MobileBottomNavProps = {
  current: MobileScreen;
  onSelect: (screen: MobileScreen) => void;
};

export function MobileBottomNav({ current, onSelect }: MobileBottomNavProps) {
  const tabs: { screen: MobileScreen; label: string; Icon: typeof LayoutDashboard }[] = [
    { screen: "home", label: "Dashboard", Icon: LayoutDashboard },
    { screen: "add", label: "Add Site", Icon: PlusCircle },
    { screen: "account", label: "Account", Icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around py-2 px-2 bg-background/95 backdrop-blur border-t border-border safe-area-pb"
      aria-label="Main navigation"
    >
      {tabs.map(({ screen, label, Icon }) => {
        const active = current === screen;
        return (
          <button
            key={screen}
            type="button"
            onClick={() => onSelect(screen)}
            className={`flex flex-col items-center justify-center gap-1 py-2 px-4 min-w-[72px] rounded-xl transition-colors ${
              active ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
