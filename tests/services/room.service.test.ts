import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomService } from "@/services/room.service";
import { roomRepository } from "@/repositories/room.repository";
import { RoomStatus, RoomType } from "@prisma/client";

vi.mock("@/repositories/room.repository", () => ({
  roomRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    existsByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe("RoomService", () => {
  let roomService: RoomService;

  const mockRoom = {
    id: "room-uuid-123",
    name: "Boardroom Alpha",
    code: "CONF_301",
    description: "Executive boardroom",
    floor: 3,
    building: "Main Tower",
    capacity: 16,
    type: RoomType.BOARDROOM,
    status: RoomStatus.AVAILABLE,
    amenities: ["Projector"],
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    roomService = new RoomService();
  });

  it("listRooms returns paginated rooms", async () => {
    vi.mocked(roomRepository.findMany).mockResolvedValue({
      items: [mockRoom],
      total: 1,
    });

    const result = await roomService.listRooms({ page: 1, pageSize: 20 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.meta.total).toBe(1);
    }
  });

  it("getRoomById returns ROOM_NOT_FOUND when room does not exist", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(null);

    const result = await roomService.getRoomById("non-existent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ROOM_NOT_FOUND");
    }
  });

  it("createRoom fails if room code already exists", async () => {
    vi.mocked(roomRepository.existsByCode).mockResolvedValue(true);

    const result = await roomService.createRoom({
      name: "Boardroom Alpha",
      code: "CONF_301",
      floor: 3,
      capacity: 16,
      type: RoomType.BOARDROOM,
      amenities: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ROOM_CODE_EXISTS");
    }
  });

  it("createRoom succeeds when code is unique", async () => {
    vi.mocked(roomRepository.existsByCode).mockResolvedValue(false);
    vi.mocked(roomRepository.create).mockResolvedValue(mockRoom);

    const result = await roomService.createRoom({
      name: "Boardroom Alpha",
      code: "CONF_301",
      floor: 3,
      capacity: 16,
      type: RoomType.BOARDROOM,
      amenities: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.code).toBe("CONF_301");
    }
  });

  it("updateAvailability updates room status", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(mockRoom);
    vi.mocked(roomRepository.updateStatus).mockResolvedValue({
      ...mockRoom,
      status: RoomStatus.MAINTENANCE,
    });

    const result = await roomService.updateAvailability("room-uuid-123", {
      status: RoomStatus.MAINTENANCE,
      reason: "AC maintenance",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(RoomStatus.MAINTENANCE);
    }
  });
});
