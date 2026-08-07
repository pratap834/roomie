import { Badge } from "@/components/ui/badge";
import type { RoomStatus } from "@/types";
import {
  ROOM_STATUS_BADGE_VARIANT,
  ROOM_STATUS_LABELS,
} from "@/features/rooms/utils/room-display";

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <Badge variant={ROOM_STATUS_BADGE_VARIANT[status]}>{ROOM_STATUS_LABELS[status]}</Badge>
  );
}
