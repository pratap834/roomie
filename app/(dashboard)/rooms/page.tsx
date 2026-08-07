"use client";

import * as React from "react";
import Link from "next/link";
import type { RowSelectionState } from "@tanstack/react-table";
import { DoorOpen, Plus, SearchX, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoomFilters } from "@/features/rooms/components/room-filters";
import { RoomsTable } from "@/features/rooms/components/rooms-table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useRooms } from "@/features/rooms/hooks/use-rooms";
import { useDeleteRoom } from "@/features/rooms/hooks/use-delete-room";
import { useBulkDeleteRooms } from "@/features/rooms/hooks/use-bulk-delete-rooms";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";
import { DEFAULT_ROOM_LIST_STATE, type RoomListState } from "@/features/rooms/types/room-list-state";
import type { Room } from "@/types";

export default function RoomsPage() {
  usePageBreadcrumbs([{ label: "Dashboard", href: "/dashboard" }, { label: "Rooms" }]);

  const [filters, setFilters] = React.useState<RoomListState>(DEFAULT_ROOM_LIST_STATE);
  const [roomPendingDelete, setRoomPendingDelete] = React.useState<Room | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const { data, isLoading, isFetching, isError, refetch } = useRooms({
    search: debouncedSearch || undefined,
    status: filters.status === "ALL" ? undefined : filters.status,
    type: filters.type === "ALL" ? undefined : filters.type,
    page: filters.page,
    pageSize: filters.pageSize,
  });

  const deleteRoom = useDeleteRoom();
  const bulkDeleteRooms = useBulkDeleteRooms();

  const rooms = data?.items ?? [];
  const hasFilters =
    filters.search !== "" || filters.status !== "ALL" || filters.type !== "ALL";
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  React.useEffect(() => {
    setRowSelection({});
  }, [filters.page, debouncedSearch, filters.status, filters.type]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rooms"
        description="Manage the meeting rooms available for booking."
        actions={
          <Button asChild size="sm">
            <Link href="/rooms/new">
              <Plus className="h-4 w-4" />
              New room
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="space-y-3">
          <RoomFilters state={filters} onChange={setFilters} />

          <BulkActionBar
            count={selectedIds.length}
            onClear={() => setRowSelection({})}
            actions={
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            }
          />

          {isError ? (
            <ErrorState
              title="Couldn't load rooms"
              description="Something went wrong while fetching the room list."
              onRetry={() => refetch()}
            />
          ) : isLoading ? (
            <TableSkeleton columnWidths={["w-32", "w-24", "w-20", "w-16", "w-20"]} hasSelection />
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={hasFilters ? SearchX : DoorOpen}
              title={hasFilters ? "No rooms match your filters" : "No rooms yet"}
              description={
                hasFilters
                  ? "Try adjusting your search or filters."
                  : "Add your first meeting room to get started."
              }
              action={
                !hasFilters && (
                  <Button asChild size="sm">
                    <Link href="/rooms/new">
                      <Plus className="h-4 w-4" />
                      New room
                    </Link>
                  </Button>
                )
              }
            />
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
              <RoomsTable
                rooms={rooms}
                onDelete={setRoomPendingDelete}
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
        open={roomPendingDelete !== null}
        onOpenChange={(open) => !open && setRoomPendingDelete(null)}
        title="Delete room"
        description={
          roomPendingDelete
            ? `This will permanently remove "${roomPendingDelete.name}" (${roomPendingDelete.code}) from the directory.`
            : ""
        }
        isPending={deleteRoom.isPending}
        onConfirm={() => {
          if (!roomPendingDelete) return;
          deleteRoom.mutate(roomPendingDelete.id, {
            onSuccess: () => setRoomPendingDelete(null),
          });
        }}
      />

      <ConfirmActionDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selectedIds.length} room${selectedIds.length === 1 ? "" : "s"}`}
        description="This will permanently remove the selected rooms from the directory."
        isPending={bulkDeleteRooms.isPending}
        onConfirm={() => {
          bulkDeleteRooms.mutate(selectedIds, {
            onSuccess: () => {
              setBulkDeleteOpen(false);
              setRowSelection({});
            },
          });
        }}
      />
    </div>
  );
}
