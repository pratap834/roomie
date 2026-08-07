"use client";

import * as React from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { MoreHorizontal, XCircle } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookingPriorityBadge,
  BookingStatusBadge,
} from "@/features/bookings/components/booking-status-badge";
import { ACTIVE_BOOKING_STATUSES } from "@/features/bookings/utils/booking-display";
import { formatDate, formatTimeRange } from "@/lib/format";
import type { BookingWithRelations } from "@/types";

interface BookingsTableProps {
  bookings: BookingWithRelations[];
  onCancel: (booking: BookingWithRelations) => void;
  selection?: {
    selected: RowSelectionState;
    onSelectedChange: (state: RowSelectionState) => void;
  };
}

export function BookingsTable({ bookings, onCancel, selection }: BookingsTableProps) {
  const columns = React.useMemo<ColumnDef<BookingWithRelations, any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Meeting",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.employee.firstName} {row.original.employee.lastName}
              {row.original.employee.department ? ` · ${row.original.employee.department}` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "room",
        header: "Room",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-foreground">{row.original.room.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.room.code}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "When",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-foreground">{formatDate(row.original.date)}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeRange(row.original.startTime, row.original.endTime)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        enableSorting: false,
        cell: ({ row }) => <BookingPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        size: 36,
        cell: ({ row }) => {
          const booking = row.original;
          const canCancel = ACTIVE_BOOKING_STATUSES.includes(booking.status);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${booking.title}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!canCancel}
                    onSelect={() => onCancel(booking)}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel booking
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onCancel],
  );

  return (
    <DataTable
      columns={columns}
      data={bookings}
      getRowId={(booking) => booking.id}
      selection={selection}
    />
  );
}
