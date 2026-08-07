import type { RoomListParams } from "@/features/rooms/services/room.service";

export const roomKeys = {
  all: ["rooms"] as const,
  lists: () => [...roomKeys.all, "list"] as const,
  list: (params: RoomListParams) => [...roomKeys.lists(), params] as const,
  details: () => [...roomKeys.all, "detail"] as const,
  detail: (id: string) => [...roomKeys.details(), id] as const,
};
