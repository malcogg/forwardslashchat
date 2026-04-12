"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { helpNavSections } from "@/lib/help-nav";
import { Menu } from "lucide-react";
import { useState } from "react";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {helpNavSections.map((section) => (
        <div key={section.title} className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-2">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export function HelpShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border p-2 md:hidden"
              aria-expanded={open}
              aria-label="Open help navigation"
              onClick={() => setOpen((o) => !o)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link href="/help" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Help center
            </Link>
            <span className="hidden text-border sm:inline">|</span>
            <Link
              href="/"
              className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline"
            >
              ForwardSlash.Chat
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col md:flex-row md:items-start">
        <aside
          className={`${
            open ? "block" : "hidden"
          } md:block w-full shrink-0 border-b border-border md:w-60 md:border-b-0 md:border-r md:sticky md:top-14 md:max-h-[calc(100vh-3.5rem)] md:overflow-y-auto px-4 py-6 md:py-8`}
        >
          <NavLinks onNavigate={() => setOpen(false)} />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12 lg:px-14">
          <div className="mx-auto max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
