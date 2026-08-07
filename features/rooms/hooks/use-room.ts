"use client";

import { useQuery } from "@tanstack/react-query";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";

export function useRoom(id: string | undefined) {
  return useQuery({
    queryKey: roomKeys.detail(id ?? ""),
    queryFn: () => roomService.getById(id as string),
    enabled: Boolean(id),
  });
}
