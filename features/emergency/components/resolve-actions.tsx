"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRooms } from "@/features/rooms/hooks/use-rooms";
import { useResolveEmergency } from "@/features/emergency/hooks/use-resolve-emergency";
import type { EmergencyAction } from "@/types";

const ACTION_OPTIONS: { value: EmergencyAction; label: string }[] = [
  { value: "KEEP_BOOKING", label: "Keep the existing booking" },
  { value: "ROOM_TRANSFER", label: "Move to a different room" },
  { value: "RESCHEDULE", label: "Reschedule the booking" },
  { value: "REDUCE_DURATION", label: "Shorten the booking" },
  { value: "CONTACT_EMPLOYEE", label: "Ask the owner to make contact" },
];

function toIsoWithOffset(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

export function ResolveActions({ requestId }: { requestId: string }) {
  const [action, setAction] = React.useState<EmergencyAction>("KEEP_BOOKING");
  const [note, setNote] = React.useState("");
  const [targetRoomId, setTargetRoomId] = React.useState("");
  const [startLocal, setStartLocal] = React.useState("");
  const [endLocal, setEndLocal] = React.useState("");

  const resolve = useResolveEmergency(requestId);
  const { data: roomsData } = useRooms({ status: "AVAILABLE", pageSize: 100 });
  const availableRooms = roomsData?.items ?? [];

  function handleSubmit() {
    const trimmedNote = note.trim() || undefined;

    if (action === "KEEP_BOOKING" || action === "CONTACT_EMPLOYEE") {
      resolve.mutate({ action, note: trimmedNote });
      return;
    }

    if (action === "ROOM_TRANSFER") {
      if (!targetRoomId) return;
      resolve.mutate({ action, targetRoomId, note: trimmedNote });
      return;
    }

    if (action === "REDUCE_DURATION") {
      if (!endLocal) return;
      resolve.mutate({ action, endTime: toIsoWithOffset(endLocal), note: trimmedNote });
      return;
    }

    if (action === "RESCHEDULE") {
      if (!startLocal || !endLocal) return;
      const startIso = toIsoWithOffset(startLocal);
      const date = startIso.slice(0, 10);
      resolve.mutate({
        action,
        date,
        startTime: startIso,
        endTime: toIsoWithOffset(endLocal),
        note: trimmedNote,
      });
    }
  }

  const canSubmit =
    action === "KEEP_BOOKING" ||
    action === "CONTACT_EMPLOYEE" ||
    (action === "ROOM_TRANSFER" && Boolean(targetRoomId)) ||
    (action === "REDUCE_DURATION" && Boolean(endLocal)) ||
    (action === "RESCHEDULE" && Boolean(startLocal) && Boolean(endLocal));

  return (
    <div className="space-y-3 rounded-md border border-border bg-secondary/30 p-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Resolve on behalf of the owner</Label>
        <Select value={action} onValueChange={(v) => setAction(v as EmergencyAction)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {action === "ROOM_TRANSFER" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Target room</Label>
          <Select value={targetRoomId} onValueChange={setTargetRoomId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an available room" />
            </SelectTrigger>
            <SelectContent>
              {availableRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action === "RESCHEDULE" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New start</Label>
            <Input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">New end</Label>
            <Input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
            />
          </div>
        </div>
      )}

      {action === "REDUCE_DURATION" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">New end time</Label>
          <Input
            type="datetime-local"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Note (optional)</Label>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add context for the owner..."
        />
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || resolve.isPending}>
          {resolve.isPending ? "Resolving..." : "Resolve request"}
        </Button>
      </div>
    </div>
  );
}
