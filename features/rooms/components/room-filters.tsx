"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoomListState } from "@/features/rooms/types/room-list-state";
import { DEFAULT_ROOM_LIST_STATE } from "@/features/rooms/types/room-list-state";
import {
  ROOM_STATUS_LABELS,
  ROOM_STATUS_OPTIONS,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
} from "@/features/rooms/utils/room-display";

interface RoomFiltersProps {
  state: RoomListState;
  onChange: (state: RoomListState) => void;
}

export function RoomFilters({ state, onChange }: RoomFiltersProps) {
  const hasActiveFilters =
    state.search !== "" || state.status !== "ALL" || state.type !== "ALL";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(e) => onChange({ ...state, search: e.target.value, page: 1 })}
          placeholder="Search rooms..."
          className="pl-8"
          aria-label="Search rooms"
        />
      </div>

      <Select
        value={state.status}
        onValueChange={(value) =>
          onChange({ ...state, status: value as RoomListState["status"], page: 1 })
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {ROOM_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {ROOM_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.type}
        onValueChange={(value) =>
          onChange({ ...state, type: value as RoomListState["type"], page: 1 })
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filter by room type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {ROOM_TYPE_OPTIONS.map((type) => (
            <SelectItem key={type} value={type}>
              {ROOM_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_ROOM_LIST_STATE, pageSize: state.pageSize })}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
