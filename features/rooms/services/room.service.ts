import { apiRequest, buildQueryString } from "@/lib/api-client";
import type { PaginatedResult, Room, RoomFilters } from "@/types";
import type {
  CreateRoomInput,
  UpdateRoomInput,
  UpdateRoomAvailabilityInput,
} from "@/validators/room.validator";

export type RoomListParams = RoomFilters & {
  page?: number;
  pageSize?: number;
};

/**
 * Client-side service for the Room resource. Every call goes through
 * apiRequest, which unwraps the ApiResponse envelope and normalizes errors.
 * Components must never call fetch directly — always go through here.
 */
export const roomService = {
  list(params: RoomListParams = {}): Promise<PaginatedResult<Room>> {
    return apiRequest<PaginatedResult<Room>>(`/api/rooms${buildQueryString(params)}`);
  },

  getById(id: string): Promise<Room> {
    return apiRequest<Room>(`/api/rooms/${id}`);
  },

  create(input: CreateRoomInput): Promise<Room> {
    return apiRequest<Room>("/api/rooms", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: UpdateRoomInput): Promise<Room> {
    return apiRequest<Room>(`/api/rooms/${id}`, {
      method: "PUT",
      body: input,
    });
  },

  delete(id: string): Promise<{ id: string }> {
    return apiRequest<{ id: string }>(`/api/rooms/${id}`, {
      method: "DELETE",
    });
  },

  updateAvailability(id: string, input: UpdateRoomAvailabilityInput): Promise<Room> {
    return apiRequest<Room>(`/api/rooms/${id}/availability`, {
      method: "PATCH",
      body: input,
    });
  },
};
