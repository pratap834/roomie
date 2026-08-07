import { describe, it, expect } from "vitest";
import {
  createRoomSchema,
  updateRoomSchema,
  updateRoomAvailabilitySchema,
  roomFiltersSchema,
} from "@/validators/room.validator";
import { RoomStatus, RoomType } from "@prisma/client";

describe("Room Validators", () => {
  it("validates createRoomSchema input", () => {
    const input = {
      name: "Boardroom Alpha",
      code: "CONF_301",
      description: "Executive boardroom with AV conferencing",
      floor: 3,
      building: "Main Tower",
      capacity: 16,
      type: RoomType.BOARDROOM,
      amenities: ["Projector", "Whiteboard", "Video Conference"],
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid room code format", () => {
    const input = {
      name: "Boardroom Alpha",
      code: "invalid code!",
      floor: 3,
      capacity: 16,
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates updateRoomSchema input", () => {
    const input = {
      capacity: 20,
    };
    expect(updateRoomSchema.safeParse(input).success).toBe(true);
    expect(updateRoomSchema.safeParse({}).success).toBe(false);
  });

  it("validates updateRoomAvailabilitySchema", () => {
    expect(
      updateRoomAvailabilitySchema.safeParse({
        status: RoomStatus.MAINTENANCE,
        reason: "AC unit replacement",
      }).success,
    ).toBe(true);
  });

  it("validates roomFiltersSchema", () => {
    const filters = {
      status: RoomStatus.AVAILABLE,
      minCapacity: "5",
      page: "2",
    };
    const parsed = roomFiltersSchema.safeParse(filters);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.minCapacity).toBe(5);
      expect(parsed.data.page).toBe(2);
    }
  });
});
