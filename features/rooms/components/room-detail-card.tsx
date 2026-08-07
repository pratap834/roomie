"use client";

import { Building2, LayoutGrid, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomStatusBadge } from "@/features/rooms/components/room-status-badge";
import { useUpdateRoomAvailability } from "@/features/rooms/hooks/use-update-room-availability";
import { ROOM_STATUS_LABELS, ROOM_STATUS_OPTIONS, ROOM_TYPE_LABELS } from "@/features/rooms/utils/room-display";
import type { Room, RoomStatus } from "@/types";

export function RoomDetailCard({ room }: { room: Room }) {
  const updateAvailability = useUpdateRoomAvailability(room.id);

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{room.name}</h2>
            <p className="font-mono text-xs text-muted-foreground">{room.code}</p>
          </div>
          <RoomStatusBadge status={room.status} />
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="text-sm font-medium text-foreground">
                {room.building ? `${room.building}, ` : ""}Floor {room.floor}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Capacity</dt>
              <dd className="text-sm font-medium text-foreground">{room.capacity} people</dd>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border p-3">
            <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="text-sm font-medium text-foreground">{ROOM_TYPE_LABELS[room.type]}</dd>
            </div>
          </div>
        </dl>

        {room.description && (
          <div>
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">Description</h3>
            <p className="text-sm text-foreground">{room.description}</p>
          </div>
        )}

        {room.amenities.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">Amenities</h3>
            <div className="flex flex-wrap gap-1.5">
              {room.amenities.map((amenity: string) => (
                <Badge key={amenity} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs font-medium text-muted-foreground">Update availability</span>
          <Select
            value={room.status}
            onValueChange={(value) =>
              updateAvailability.mutate({ status: value as RoomStatus })
            }
            disabled={updateAvailability.isPending}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOM_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {ROOM_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
