"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { CalendarPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookingFormDialog } from "@/features/bookings/components/booking-form-dialog";
import { RoomStatusBadge } from "@/features/rooms/components/room-status-badge";
import { ROOM_TYPE_LABELS } from "@/features/rooms/utils/room-display";
import type { Room } from "@/types";

interface RoomsTableProps {
  rooms: Room[];
  onDelete: (room: Room) => void;
  selection?: {
    selected: RowSelectionState;
    onSelectedChange: (state: RowSelectionState) => void;
  };
}

export function RoomsTable({ rooms, onDelete, selection }: RoomsTableProps) {
  const router = useRouter();
  const [bookingRoom, setBookingRoom] = React.useState<Room | null>(null);

  const columns = React.useMemo<ColumnDef<Room, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Room",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "floor",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.building ? `${row.original.building}, ` : ""}Floor{" "}
            {row.original.floor}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{ROOM_TYPE_LABELS[row.original.type]}</span>
        ),
      },
      {
        accessorKey: "capacity",
        header: "Capacity",
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.capacity}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <RoomStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        size: 36,
        cell: ({ row }) => {
          const room = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${room.name}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {room.status === "AVAILABLE" && (
                    <DropdownMenuItem onSelect={() => setBookingRoom(room)}>
                      <CalendarPlus className="h-4 w-4" />
                      Book this room
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href={`/rooms/${room.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      Edit room
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(room)}>
                    <Trash2 className="h-4 w-4" />
                    Delete room
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onDelete],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rooms}
        getRowId={(room) => room.id}
        onRowClick={(room) => router.push(`/rooms/${room.id}`)}
        selection={selection}
      />
      <BookingFormDialog
        open={bookingRoom !== null}
        onOpenChange={(open) => !open && setBookingRoom(null)}
        preselectedRoomId={bookingRoom?.id}
      />
    </>
  );
}
