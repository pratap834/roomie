"use client";

import { MobileNav } from "@/layouts/mobile-nav";
import { UserMenu } from "@/layouts/user-menu";
import { PageBreadcrumbs } from "@/layouts/page-breadcrumbs";
import { useBreadcrumbContext } from "@/layouts/breadcrumb-context";

export function Topbar() {
  const { items } = useBreadcrumbContext();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
      <MobileNav />
      <div className="min-w-0 flex-1">
        {items.length > 0 && <PageBreadcrumbs items={items} />}
      </div>
      <UserMenu />
    </header>
  );
}
