import { z } from "zod";
import { RoomType, RoomStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Base field schemas
// ─────────────────────────────────────────────────────────────

const roomName = z
  .string()
  .min(2, "Room name must be at least 2 characters")
  .max(100, "Room name must not exceed 100 characters")
  .trim();

const roomCode = z
  .string()
  .min(2, "Room code must be at least 2 characters")
  .max(20, "Room code must not exceed 20 characters")
  .regex(
    /^[A-Z0-9_-]+$/,
    "Room code must contain only uppercase letters, digits, underscores, or hyphens",
  )
  .trim();

const floor = z
  .number({ required_error: "Floor is required" })
  .int("Floor must be an integer")
  .min(-10, "Floor must be at least -10")
  .max(200, "Floor must not exceed 200");

const capacity = z
  .number({ required_error: "Capacity is required" })
  .int("Capacity must be an integer")
  .min(1, "Capacity must be at least 1")
  .max(1000, "Capacity must not exceed 1000");

const amenities = z
  .array(z.string().min(1).max(50))
  .max(30, "Cannot list more than 30 amenities")
  .default([]);

// ─────────────────────────────────────────────────────────────
// Create Room
// ─────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  name: roomName,
  code: roomCode,
  description: z.string().max(500).trim().optional(),
  floor,
  building: z.string().max(100).trim().optional(),
  capacity,
  type: z.nativeEnum(RoomType).default(RoomType.CONFERENCE),
  amenities,
  imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

// ─────────────────────────────────────────────────────────────
// Update Room
// ─────────────────────────────────────────────────────────────

export const updateRoomSchema = z.object({
  name: roomName.optional(),
  description: z.string().max(500).trim().optional(),
  floor: floor.optional(),
  building: z.string().max(100).trim().optional(),
  capacity: capacity.optional(),
  type: z.nativeEnum(RoomType).optional(),
  amenities: amenities.optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided for update",
);

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// ─────────────────────────────────────────────────────────────
// Update Room Availability
// ─────────────────────────────────────────────────────────────

export const updateRoomAvailabilitySchema = z.object({
  status: z.nativeEnum(RoomStatus, {
    required_error: "Status is required",
    invalid_type_error: "Invalid room status",
  }),
  reason: z.string().max(255).trim().optional(),
});

export type UpdateRoomAvailabilityInput = z.infer<typeof updateRoomAvailabilitySchema>;

// ─────────────────────────────────────────────────────────────
// Room list/filter query params
// ─────────────────────────────────────────────────────────────

export const roomFiltersSchema = z.object({
  status: z.nativeEnum(RoomStatus).optional(),
  type: z.nativeEnum(RoomType).optional(),
  minCapacity: z.coerce.number().int().min(1).optional(),
  maxCapacity: z.coerce.number().int().min(1).optional(),
  floor: z.coerce.number().int().optional(),
  building: z.string().trim().optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type RoomFiltersInput = z.infer<typeof roomFiltersSchema>;
