import type { RoomStatus, RoomType } from "@/types";

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: "Available",
  UNAVAILABLE: "Unavailable",
  MAINTENANCE: "Maintenance",
};

export const ROOM_STATUS_BADGE_VARIANT: Record<
  RoomStatus,
  "success" | "destructive" | "warning"
> = {
  AVAILABLE: "success",
  UNAVAILABLE: "destructive",
  MAINTENANCE: "warning",
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  CONFERENCE: "Conference",
  BOARDROOM: "Boardroom",
  TRAINING: "Training",
  PHONE_BOOTH: "Phone booth",
  COLLABORATION: "Collaboration",
  EXECUTIVE: "Executive",
};

export const ROOM_STATUS_OPTIONS: RoomStatus[] = ["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"];
export const ROOM_TYPE_OPTIONS: RoomType[] = [
  "CONFERENCE",
  "BOARDROOM",
  "TRAINING",
  "PHONE_BOOTH",
  "COLLABORATION",
  "EXECUTIVE",
];
