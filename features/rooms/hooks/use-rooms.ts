"use client";

import { useQuery } from "@tanstack/react-query";

import { roomService, type RoomListParams } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";

export function useRooms(params: RoomListParams = {}) {
  return useQuery({
    queryKey: roomKeys.list(params),
    queryFn: () => roomService.list(params),
    placeholderData: (previousData) => previousData,
  });
}
