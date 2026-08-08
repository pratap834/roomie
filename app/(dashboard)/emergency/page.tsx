"use client";

import * as React from "react";
import { AlertTriangle, Plus, SearchX } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmergencyFilters } from "@/features/emergency/components/emergency-filters";
import { EmergencyTable } from "@/features/emergency/components/emergency-table";
import { EmergencyFormDialog } from "@/features/emergency/components/emergency-form-dialog";
import { useEmergencyRequests } from "@/features/emergency/hooks/use-emergency-requests";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";
import {
  DEFAULT_EMERGENCY_LIST_STATE,
  type EmergencyListState,
} from "@/features/emergency/types/emergency-list-state";

import { useUser } from "@clerk/nextjs";

export default function EmergencyRequestsPage() {
  usePageBreadcrumbs([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Emergency requests" },
  ]);

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "ADMIN";

  const [filters, setFilters] = React.useState<EmergencyListState>(DEFAULT_EMERGENCY_LIST_STATE);
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useEmergencyRequests({
    scope: filters.scope,
    status: filters.status === "ALL" ? undefined : filters.status,
    priority: filters.priority === "ALL" ? undefined : filters.priority,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  const requests = data?.items ?? [];
  const hasFilters = filters.status !== "ALL" || filters.priority !== "ALL";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Emergency requests"
        description="Override requests raised against active bookings."
        actions={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New emergency request
          </Button>
        }
      />

      <Card className="p-4">
        <div className="space-y-3">
          <EmergencyFilters state={filters} onChange={setFilters} isAdmin={isAdmin} />

          {isError ? (
            <ErrorState
              title="Couldn't load emergency requests"
              description="Something went wrong while fetching requests."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <TableSkeleton
              columnWidths={["w-36", "w-32", "w-16", "w-20", "w-28"]}
              hasActions={false}
            />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={hasFilters ? SearchX : AlertTriangle}
              title={hasFilters ? "No requests match your filters" : "No emergency requests"}
              description={
                hasFilters
                  ? "Try adjusting your filters."
                  : "Override requests raised by employees will show up here."
              }
            />
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
              <EmergencyTable requests={requests} />
            </div>
          )}

          {data && (
            <PaginationBar
              meta={data.meta}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          )}
        </div>
      </Card>

      <EmergencyFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
