"use client";

import * as React from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getRowId: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  /** Enables the leading checkbox column and controlled row-selection state. */
  selection?: {
    selected: RowSelectionState;
    onSelectedChange: (state: RowSelectionState) => void;
  };
  className?: string;
}

/**
 * The single table primitive used across every admin surface (Rooms,
 * Bookings, Emergency Requests). Column defs and data are supplied by the
 * feature; this component owns the shared chrome — density, borders, sort
 * affordances, and optional bulk-selection — so every table in the product
 * looks and behaves identically.
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  onRowClick,
  selection,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const allColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    if (!selection) return columns;
    const selectColumn: ColumnDef<TData, any> = {
      id: "__select",
      size: 32,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, selection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      rowSelection: selection?.selected ?? {},
    },
    getRowId,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      if (!selection) return;
      const next =
        typeof updater === "function" ? updater(selection.selected) : updater;
      selection.onSelectedChange(next);
    },
    enableRowSelection: Boolean(selection),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table className={className}>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const canSort = header.column.getCanSort();
              const sortDirection = header.column.getIsSorted();
              return (
                <TableHead
                  key={header.id}
                  style={header.column.id === "__select" ? { width: 32 } : undefined}
                >
                  {header.isPlaceholder ? null : canSort ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDirection === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : sortDirection === "desc" ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={row.getIsSelected() ? "selected" : undefined}
            className={cn(onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(row.original)}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
