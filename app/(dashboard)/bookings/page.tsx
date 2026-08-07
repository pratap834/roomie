"use client";

import * as React from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { AlertTriangle, CalendarPlus, CalendarX, SearchX, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookingFilters } from "@/features/bookings/components/booking-filters";
import { BookingsTable } from "@/features/bookings/components/bookings-table";
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import { useCancelBooking } from "@/features/bookings/hooks/use-cancel-booking";
import { useBulkCancelBookings } from "@/features/bookings/hooks/use-bulk-cancel-bookings";
import { BookingFormDialog } from "@/features/bookings/components/booking-form-dialog";
import { EmergencyFormDialog } from "@/features/emergency/components/emergency-form-dialog";
import { ACTIVE_BOOKING_STATUSES } from "@/features/bookings/utils/booking-display";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";
import {
  DEFAULT_BOOKING_LIST_STATE,
  type BookingListState,
} from "@/features/bookings/types/booking-list-state";
import type { BookingWithRelations } from "@/types";

export default function BookingsPage() {
  usePageBreadcrumbs([{ label: "Dashboard", href: "/dashboard" }, { label: "Bookings" }]);

  const [filters, setFilters] = React.useState<BookingListState>(DEFAULT_BOOKING_LIST_STATE);
  const [bookingPendingCancel, setBookingPendingCancel] =
    React.useState<BookingWithRelations | null>(null);
  const [bulkCancelOpen, setBulkCancelOpen] = React.useState(false);
  const [bookFormOpen, setBookFormOpen] = React.useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { data, isLoading, isFetching, isError, refetch } = useBookings({
    status: filters.status === "ALL" ? undefined : filters.status,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  const cancelBooking = useCancelBooking();
  const bulkCancelBookings = useBulkCancelBookings();

  const bookings = data?.items ?? [];
  const hasFilters = filters.status !== "ALL" || filters.dateFrom !== "" || filters.dateTo !== "";
  const cancellableSelectedIds = Object.keys(rowSelection).filter((id) => {
    if (!rowSelection[id]) return false;
    const booking = bookings.find((b) => b.id === id);
    return booking ? ACTIVE_BOOKING_STATUSES.includes(booking.status) : false;
  });

  React.useEffect(() => {
    setRowSelection({});
  }, [filters.page, filters.status, filters.dateFrom, filters.dateTo]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bookings"
        description="Every meeting room reservation across the org."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setEmergencyDialogOpen(true)}>
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Emergency Request
            </Button>
            <Button size="sm" onClick={() => setBookFormOpen(true)}>
              <CalendarPlus className="h-4 w-4" />
              Book a room
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="space-y-3">
          <BookingFilters state={filters} onChange={setFilters} />

          <BulkActionBar
            count={cancellableSelectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setBulkCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            }
          />

          {isError ? (
            <ErrorState
              title="Couldn't load bookings"
              description="Something went wrong while fetching bookings."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <TableSkeleton
              columnWidths={["w-36", "w-28", "w-28", "w-16", "w-20"]}
              hasSelection
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={hasFilters ? SearchX : CalendarX}
              title={hasFilters ? "No bookings match your filters" : "No bookings yet"}
              description={
                hasFilters
                  ? "Try adjusting your filters."
                  : "Bookings created by employees will show up here."
              }
            />
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
              <BookingsTable
                bookings={bookings}
                onCancel={setBookingPendingCancel}
                selection={{ selected: rowSelection, onSelectedChange: setRowSelection }}
              />
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

      <ConfirmActionDialog
        open={bookingPendingCancel !== null}
        onOpenChange={(open) => !open && setBookingPendingCancel(null)}
        title="Cancel booking"
        description={
          bookingPendingCancel
            ? `This will cancel "${bookingPendingCancel.title}" for ${bookingPendingCancel.employee.firstName} ${bookingPendingCancel.employee.lastName}. The employee will be notified.`
            : ""
        }
        confirmLabel="Cancel booking"
        pendingLabel="Cancelling..."
        isPending={cancelBooking.isPending}
        onConfirm={() => {
          if (!bookingPendingCancel) return;
          cancelBooking.mutate(
            { id: bookingPendingCancel.id },
            { onSuccess: () => setBookingPendingCancel(null) },
          );
        }}
      />

      <ConfirmActionDialog
        open={bulkCancelOpen}
        onOpenChange={setBulkCancelOpen}
        title={`Cancel ${cancellableSelectedIds.length} booking${cancellableSelectedIds.length === 1 ? "" : "s"}`}
        description="This will cancel the selected bookings and notify each employee."
        confirmLabel="Cancel bookings"
        pendingLabel="Cancelling..."
        isPending={bulkCancelBookings.isPending}
        onConfirm={() => {
          bulkCancelBookings.mutate(cancellableSelectedIds, {
            onSuccess: () => {
              setBulkCancelOpen(false);
              setRowSelection({});
            },
          });
        }}
      />

      <BookingFormDialog open={bookFormOpen} onOpenChange={setBookFormOpen} />
      <EmergencyFormDialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen} />
    </div>
  );
}
