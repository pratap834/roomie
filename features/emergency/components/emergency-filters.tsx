"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmergencyListState } from "@/features/emergency/types/emergency-list-state";
import { DEFAULT_EMERGENCY_LIST_STATE } from "@/features/emergency/types/emergency-list-state";
import {
  EMERGENCY_PRIORITY_LABELS,
  EMERGENCY_PRIORITY_OPTIONS,
  EMERGENCY_STATUS_LABELS,
  EMERGENCY_STATUS_OPTIONS,
} from "@/features/emergency/utils/emergency-display";

interface EmergencyFiltersProps {
  state: EmergencyListState;
  onChange: (state: EmergencyListState) => void;
}

export function EmergencyFilters({ state, onChange }: EmergencyFiltersProps) {
  const hasActiveFilters = state.status !== "ALL" || state.priority !== "ALL";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={state.status}
        onValueChange={(value) =>
          onChange({ ...state, status: value as EmergencyListState["status"], page: 1 })
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {EMERGENCY_STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {EMERGENCY_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.priority}
        onValueChange={(value) =>
          onChange({ ...state, priority: value as EmergencyListState["priority"], page: 1 })
        }
      >
        <SelectTrigger className="sm:w-40" aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All priorities</SelectItem>
          {EMERGENCY_PRIORITY_OPTIONS.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {EMERGENCY_PRIORITY_LABELS[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ ...DEFAULT_EMERGENCY_LIST_STATE, pageSize: state.pageSize })}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
