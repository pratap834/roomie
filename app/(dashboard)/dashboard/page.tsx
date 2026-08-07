"use client";

import { CheckCircle2, DoorOpen, LayoutGrid, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { RecentlyUpdatedRooms } from "@/features/dashboard/components/recently-updated-rooms";
import { useDashboardRooms } from "@/features/dashboard/hooks/use-dashboard-rooms";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";

export default function DashboardPage() {
  usePageBreadcrumbs([{ label: "Dashboard" }]);

  const { data, isLoading, isError, refetch } = useDashboardRooms();
  const rooms = data?.items ?? [];

  const totalRooms = data?.meta.total ?? 0;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const unavailableRooms = rooms.filter((r) => r.status !== "AVAILABLE").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A quick overview of your meeting rooms." />

      {isError ? (
        <ErrorState
          title="Couldn't load dashboard data"
          description="We couldn't reach the rooms service. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Total rooms"
              value={totalRooms}
              icon={LayoutGrid}
              isLoading={isLoading}
            />
            <StatCard
              label="Available rooms"
              value={availableRooms}
              icon={CheckCircle2}
              accent="success"
              isLoading={isLoading}
            />
            <StatCard
              label="Unavailable rooms"
              value={unavailableRooms}
              icon={XCircle}
              accent="destructive"
              isLoading={isLoading}
            />
          </div>

          {!isLoading && rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
              <DoorOpen className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">No rooms yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Rooms you add will appear here along with their availability.
              </p>
            </div>
          ) : (
            <RecentlyUpdatedRooms rooms={rooms} />
          )}
        </>
      )}
    </div>
  );
}
