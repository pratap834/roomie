"use client";

import * as React from "react";

import type { BreadcrumbEntry } from "@/layouts/page-breadcrumbs";

interface BreadcrumbContextValue {
  items: BreadcrumbEntry[];
  setItems: (items: BreadcrumbEntry[]) => void;
}

const BreadcrumbContext = React.createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<BreadcrumbEntry[]>([]);
  const value = React.useMemo(() => ({ items, setItems }), [items]);

  return (
    <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  const ctx = React.useContext(BreadcrumbContext);
  if (!ctx) {
    throw new Error("useBreadcrumbContext must be used within BreadcrumbProvider");
  }
  return ctx;
}

/**
 * Sets the breadcrumb trail shown in the top navigation for the lifetime of
 * the calling page. Pass a memoized array to avoid redundant re-renders.
 */
export function usePageBreadcrumbs(items: BreadcrumbEntry[]) {
  const { setItems } = useBreadcrumbContext();
  const key = items.map((item) => `${item.label}:${item.href ?? ""}`).join("|");

  React.useEffect(() => {
    setItems(items);
    return () => setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
