"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-foreground transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
              aria-hidden
            />
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="font-serif text-lg font-medium tracking-tight text-foreground">
          Room Booking
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto py-6">
        <SidebarNav />
      </div>
      <div className="border-t border-sidebar-border px-6 py-4 text-xs tracking-wide text-muted-foreground">
        Internal tool · v1.0
      </div>
    </aside>
  );
}
