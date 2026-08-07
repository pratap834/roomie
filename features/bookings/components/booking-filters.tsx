"use client";

import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { BookingListState } from "@/features/bookings/types/booking-list-state";
import { DEFAULT_BOOKING_LIST_STATE } from "@/features/bookings/types/booking-list-state";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_OPTIONS } from "@/features/bookings/utils/booking-display";

interface BookingFiltersProps {
  state: BookingListState;
  onChange: (state: BookingListState) => void;
}

export function BookingFilters({ state, onChange }: BookingFiltersProps) {
  const hasActiveFilters =
    state.status !== "ALL" || state.dateFrom !== "" || state.dateTo !== "";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={state.dateFrom}
          onChange={(e) => onChange({ ...state, dateFrom: e.target.value, page: 1 })}
          className="sm:w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={state.dateTo}
          onChange={(e) => onChange({ ...state, dateTo: e.target.value, page: 1 })}
          className="sm:w-40"
        />
      </div>

      <Select
        value={state.status}
        onValueChange={(value) =>
          onChange({ ...state, status: value as BookingListState["status"], page: 1 })
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {BOOKING_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {BOOKING_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_BOOKING_LIST_STATE, pageSize: state.pageSize })}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
