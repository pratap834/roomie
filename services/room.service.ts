import { roomRepository } from "@/repositories/room.repository";
import { createLogger } from "@/utils/logger";
import { buildPaginationMeta } from "@/utils/api-response";
import type { Room, RoomStatus } from "@prisma/client";
import type {
  PaginatedResult,
  RoomFilters,
  ServiceResult,
} from "@/types";
import type {
  CreateRoomInput,
  UpdateRoomInput,
  UpdateRoomAvailabilityInput,
} from "@/validators/room.validator";

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IRoomService {
  listRooms(
    filters: RoomFilters & { page?: number; pageSize?: number },
  ): Promise<ServiceResult<PaginatedResult<Room>>>;
  getRoomById(id: string): Promise<ServiceResult<Room>>;
  createRoom(input: CreateRoomInput): Promise<ServiceResult<Room>>;
  updateRoom(id: string, input: UpdateRoomInput): Promise<ServiceResult<Room>>;
  deleteRoom(id: string): Promise<ServiceResult<{ id: string }>>;
  updateAvailability(
    id: string,
    input: UpdateRoomAvailabilityInput,
  ): Promise<ServiceResult<Room>>;
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

const log = createLogger("RoomService");

export class RoomService implements IRoomService {
  async listRooms(
    filters: RoomFilters & { page?: number; pageSize?: number },
  ): Promise<ServiceResult<PaginatedResult<Room>>> {
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;

      const { items, total } = await roomRepository.findMany({
        status: filters.status,
        type: filters.type,
        minCapacity: filters.minCapacity,
        maxCapacity: filters.maxCapacity,
        floor: filters.floor,
        building: filters.building,
        isActive: filters.isActive,
        search: filters.search,
        page,
        pageSize,
      });

      return {
        ok: true,
        data: {
          items,
          meta: buildPaginationMeta(total, page, pageSize),
        },
      };
    } catch (error) {
      log.error("Failed to list rooms", error);
      return { ok: false, error: "Failed to retrieve rooms", code: "INTERNAL_ERROR" };
    }
  }

  async getRoomById(id: string): Promise<ServiceResult<Room>> {
    try {
      const room = await roomRepository.findById(id);
      if (!room) {
        return { ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" };
      }
      return { ok: true, data: room };
    } catch (error) {
      log.error("Failed to get room by ID", error);
      return { ok: false, error: "Failed to retrieve room", code: "INTERNAL_ERROR" };
    }
  }

  async createRoom(input: CreateRoomInput): Promise<ServiceResult<Room>> {
    try {
      const codeExists = await roomRepository.existsByCode(input.code);
      if (codeExists) {
        return {
          ok: false,
          error: "A room with this code already exists",
          code: "ROOM_CODE_EXISTS",
        };
      }

      const room = await roomRepository.create({
        name: input.name,
        code: input.code,
        description: input.description,
        floor: input.floor,
        building: input.building,
        capacity: input.capacity,
        type: input.type,
        amenities: input.amenities,
        imageUrl: input.imageUrl,
      });

      log.info("Room created", { id: room.id, code: room.code });
      return { ok: true, data: room };
    } catch (error) {
      log.error("Failed to create room", error);
      return { ok: false, error: "Failed to create room", code: "INTERNAL_ERROR" };
    }
  }

  async updateRoom(
    id: string,
    input: UpdateRoomInput,
  ): Promise<ServiceResult<Room>> {
    try {
      const existing = await roomRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" };
      }

      const room = await roomRepository.update(id, {
        name: input.name,
        description: input.description,
        floor: input.floor,
        building: input.building,
        capacity: input.capacity,
        type: input.type,
        amenities: input.amenities,
        imageUrl: input.imageUrl,
      });

      log.info("Room updated", { id: room.id });
      return { ok: true, data: room };
    } catch (error) {
      log.error("Failed to update room", error);
      return { ok: false, error: "Failed to update room", code: "INTERNAL_ERROR" };
    }
  }

  async deleteRoom(id: string): Promise<ServiceResult<{ id: string }>> {
    try {
      const existing = await roomRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" };
      }

      await roomRepository.delete(id);

      log.info("Room deleted", { id });
      return { ok: true, data: { id } };
    } catch (error) {
      log.error("Failed to delete room", error);
      return { ok: false, error: "Failed to delete room", code: "INTERNAL_ERROR" };
    }
  }

  async updateAvailability(
    id: string,
    input: UpdateRoomAvailabilityInput,
  ): Promise<ServiceResult<Room>> {
    try {
      const existing = await roomRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" };
      }

      const room = await roomRepository.updateStatus(id, input.status as RoomStatus);

      log.info("Room availability updated", { id, status: input.status });
      return { ok: true, data: room };
    } catch (error) {
      log.error("Failed to update room availability", error);
      return { ok: false, error: "Failed to update room availability", code: "INTERNAL_ERROR" };
    }
  }
}

export const roomService = new RoomService();
