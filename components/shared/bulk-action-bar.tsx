import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: React.ReactNode;
}

/**
 * Compact selection toolbar shared by every table that supports bulk
 * actions. Sits directly above the table so the interaction pattern reads
 * identically whether you're bulk-deleting rooms or bulk-cancelling
 * bookings.
 */
export function BulkActionBar({ count, onClear, actions }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 px-3 py-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-medium text-foreground">
          {count} selected
        </span>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
