"use client";

import { Bell } from "lucide-react";

export type DashboardNotificationItem = { id: string; title: string; body: string; read: boolean };

type DashboardNotificationBellProps = {
  notifications: DashboardNotificationItem[];
  open: boolean;
  setOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSelect: (item: DashboardNotificationItem) => void;
};

export function DashboardNotificationBell({
  notifications,
  open,
  setOpen,
  onSelect,
}: DashboardNotificationBellProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {notifications.some((n) => !n.read) && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,20rem)] max-h-[min(320px,70vh)] overflow-y-auto rounded-xl border border-border bg-background shadow-xl z-50 py-1">
            <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Notifications</p>
            {notifications.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelect(n);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 flex flex-col gap-0.5 ${!n.read ? "bg-muted/30" : ""}`}
                >
                  <span className="font-medium text-foreground">{n.title}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{n.body}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
