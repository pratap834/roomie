"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AmenitiesInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function AmenitiesInput({ value, onChange, disabled }: AmenitiesInputProps) {
  const [draft, setDraft] = React.useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {value.map((amenity) => (
        <Badge key={amenity} variant="secondary" className="gap-1 py-0.5">
          {amenity}
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== amenity))}
              className="rounded-full outline-none hover:text-destructive focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={`Remove ${amenity}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <input
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commitDraft();
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? "Type an amenity and press Enter" : ""}
        className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );
}
