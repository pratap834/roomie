"use client";

import { Settings } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";

export default function SettingsPage() {
  usePageBreadcrumbs([{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]);

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Workspace and account preferences." />
      <EmptyState
        icon={Settings}
        title="Settings are coming soon"
        description="Workspace configuration will live here in a future phase."
      />
    </div>
  );
}
