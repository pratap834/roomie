"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import {
  EmergencyPriorityBadge,
  EmergencyStatusBadge,
} from "@/features/emergency/components/emergency-status-badge";
import { formatDateTime } from "@/lib/format";
import type { EmergencyRequestWithRelations } from "@/types";

export function EmergencyTable({ requests }: { requests: EmergencyRequestWithRelations[] }) {
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<EmergencyRequestWithRelations, any>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Request",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{row.original.subject}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.employee.firstName} {row.original.employee.lastName}
              {row.original.employee.department ? ` · ${row.original.employee.department}` : ""}
            </span>
          </div>
        ),
      },
      {
        id: "booking",
        header: "Affected booking",
        enableSorting: false,
        cell: ({ row }) => {
          const booking = row.original.booking;
          if (!booking) {
            return <span className="text-xs text-muted-foreground">Booking removed</span>;
          }
          return (
            <div className="flex flex-col">
              <span className="text-foreground">{booking.title}</span>
              <span className="text-xs text-muted-foreground">
                {booking.room.name} · {booking.employee.firstName} {booking.employee.lastName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        enableSorting: false,
        cell: ({ row }) => <EmergencyPriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <EmergencyStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={requests}
      getRowId={(request) => request.id}
      onRowClick={(request) => router.push(`/emergency/${request.id}`)}
    />
  );
}
