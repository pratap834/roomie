"use client";

import { useRooms } from "@/features/rooms/hooks/use-rooms";

/**
 * Pulls a broad snapshot of rooms (up to the API's max page size) so the
 * dashboard can derive simple counts and a recently-updated list without
 * requiring a dedicated analytics endpoint.
 */
export function useDashboardRooms() {
  return useRooms({ pageSize: 100, page: 1 });
}
