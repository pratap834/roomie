import type { RoomSummary } from "@/types";

/** Room fields needed to render a human-readable location label. */
export type LocatableRoom = Pick<RoomSummary, "name" | "code" | "floor" | "building">;

/**
 * Renders "Floor 3" or "West Wing, Floor 3" — the physical placement of a room.
 */
export function formatFloorLabel(
  room: Pick<LocatableRoom, "floor" | "building">,
): string {
  return room.building
    ? `${room.building}, Floor ${room.floor}`
    : `Floor ${room.floor}`;
}

/**
 * Renders the full location string used in calendar LOCATION fields and email
 * detail rows, e.g. "Aurora (AUR-01) — West Wing, Floor 3".
 */
export function formatLocationLabel(room: LocatableRoom): string {
  return `${room.name} (${room.code}) — ${formatFloorLabel(room)}`;
}
