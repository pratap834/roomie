import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmergencyService } from "@/services/emergency.service";
import { emergencyRepository } from "@/repositories/emergency.repository";
import { bookingRepository } from "@/repositories/booking.repository";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/services/email.service";
import {
  BookingPriority,
  BookingStatus,
  EmergencyAction,
  EmergencyPriority,
  EmergencyStatus,
  RoomStatus,
} from "@prisma/client";

vi.mock("@/repositories/emergency.repository", () => ({
  emergencyRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findPendingForBooking: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
  PENDING_EMERGENCY_STATUSES: ["OPEN", "IN_REVIEW"],
}));

vi.mock("@/repositories/booking.repository", () => ({
  bookingRepository: {
    findById: vi.fn(),
    findOverlapping: vi.fn(),
    addHistory: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/services/email.service", () => ({
  emailService: {
    sendEmergencyRequest: vi.fn(),
    sendEmergencyApproved: vi.fn(),
    sendEmergencyRejected: vi.fn(),
  },
}));

describe("EmergencyService", () => {
  let emergencyService: EmergencyService;

  const mockEmployee = {
    id: "employee-123",
    firstName: "Alice",
    lastName: "Zhang",
    email: "alice.zhang@example.com",
    department: "Operations",
  };

  const mockRoom = {
    id: "room-123",
    name: "Boardroom Alpha",
    code: "CONF_301",
    floor: 3,
    building: "Main Tower",
    capacity: 16,
  };

  const mockBooking = {
    id: "booking-123",
    title: "Sprint Review",
    date: new Date("2026-08-10"),
    startTime: new Date("2026-08-10T10:00:00.000Z"),
    endTime: new Date("2026-08-10T11:00:00.000Z"),
    status: BookingStatus.CONFIRMED,
    employeeId: "owner-employee-id",
    roomId: "room-123",
    attendeeCount: 6,
    employee: mockEmployee,
    room: mockRoom,
  };

  const mockEmergencyRequest = {
    id: "emergency-123",
    subject: "Critical board meeting",
    description: "Board of directors emergency session",
    department: "Executive",
    requestedStartTime: null,
    requestedEndTime: null,
    priority: EmergencyPriority.HIGH,
    status: EmergencyStatus.OPEN,
    resolutionAction: null,
    decidedAt: null,
    resolvedAt: null,
    resolution: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    employeeId: "employee-123",
    roomId: "room-123",
    bookingId: "booking-123",
    transferRoomId: null,
    decidedById: null,
    employee: mockEmployee,
    room: mockRoom,
    transferRoom: null,
    booking: {
      ...mockBooking,
      employee: mockEmployee,
      room: mockRoom,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    emergencyService = new EmergencyService();
  });

  describe("createRequest", () => {
    it("rejects request against own booking", async () => {
      const fakeTx = {
        booking: {
          findFirst: vi.fn().mockResolvedValue({
            id: "booking-123",
            status: BookingStatus.CONFIRMED,
            employeeId: "employee-123", // same as requester
            roomId: "room-123",
          }),
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(fakeTx);
      });

      const result = await emergencyService.createRequest(
        {
          bookingId: "booking-123",
          subject: "Need the room urgently",
          reason: "External client arrived unannounced for critical meeting",
          priority: EmergencyPriority.HIGH,
        },
        "employee-123", // same as booking owner
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("EMERGENCY_OWN_BOOKING");
      }
    });

    it("prevents duplicate pending emergency requests for same booking", async () => {
      const fakeTx = {
        booking: {
          findFirst: vi.fn().mockResolvedValue({
            id: "booking-123",
            status: BookingStatus.CONFIRMED,
            employeeId: "owner-employee-id",
            roomId: "room-123",
          }),
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(fakeTx);
      });

      vi.mocked(emergencyRepository.findPendingForBooking).mockResolvedValue(
        mockEmergencyRequest as any,
      );

      const result = await emergencyService.createRequest(
        {
          bookingId: "booking-123",
          subject: "Need the room urgently",
          reason: "External client arrived unannounced for critical meeting",
          priority: EmergencyPriority.HIGH,
        },
        "employee-123",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("EMERGENCY_DUPLICATE");
      }
    });
  });

  describe("getRequestById", () => {
    it("returns EMERGENCY_NOT_FOUND for non-existent emergency", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(null);

      const result = await emergencyService.getRequestById(
        "non-existent",
        "employee-123",
        false,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("EMERGENCY_NOT_FOUND");
      }
    });

    it("returns FORBIDDEN for unauthorized viewer", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(
        mockEmergencyRequest as any,
      );

      // Neither requester, owner, nor admin
      const result = await emergencyService.getRequestById(
        "emergency-123",
        "random-employee-id",
        false,
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("FORBIDDEN");
      }
    });

    it("returns request data when requester is the requester", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(
        mockEmergencyRequest as any,
      );

      const result = await emergencyService.getRequestById(
        "emergency-123",
        "employee-123", // requesterId
        false,
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.subject).toBe("Critical board meeting");
      }
    });

    it("returns request data when requester is an admin", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(
        mockEmergencyRequest as any,
      );

      const result = await emergencyService.getRequestById(
        "emergency-123",
        "admin-id",
        true, // isAdmin
      );

      expect(result.ok).toBe(true);
    });
  });

  describe("listRequestsForUser", () => {
    it("filters by requester employeeId when scope is my_requests", async () => {
      vi.mocked(emergencyRepository.findMany).mockResolvedValue({
        items: [mockEmergencyRequest as any],
        total: 1,
      });

      const result = await emergencyService.listRequestsForUser(
        "employee-123",
        { scope: "my_requests", page: 1, pageSize: 20 },
        false,
      );

      expect(result.ok).toBe(true);
      expect(emergencyRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: "employee-123",
        }),
      );
    });

    it("filters by bookingOwnerId when scope is incoming", async () => {
      vi.mocked(emergencyRepository.findMany).mockResolvedValue({
        items: [mockEmergencyRequest as any],
        total: 1,
      });

      const result = await emergencyService.listRequestsForUser(
        "employee-123",
        { scope: "incoming", page: 1, pageSize: 20 },
        false,
      );

      expect(result.ok).toBe(true);
      expect(emergencyRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingOwnerId: "employee-123",
        }),
      );
    });
  });

  describe("adminDecide", () => {
    it("rejects if emergency request does not exist", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(null);

      const result = await emergencyService.adminDecide(
        "non-existent",
        { decision: "APPROVE" },
        "admin-123",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("EMERGENCY_NOT_FOUND");
      }
    });

    it("successfully approves a pending emergency request", async () => {
      vi.mocked(emergencyRepository.findById).mockResolvedValue(
        mockEmergencyRequest as any,
      );

      const approvedRequest = {
        ...mockEmergencyRequest,
        status: EmergencyStatus.APPROVED,
        decidedById: "admin-123",
        decidedAt: new Date(),
        resolvedAt: new Date(),
      };

      const fakeTx = {
        emergencyRequest: {
          findFirst: vi.fn().mockResolvedValue({ id: "emergency-123" }),
        },
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback(fakeTx);
      });

      vi.mocked(emergencyRepository.updateStatus).mockResolvedValue(
        approvedRequest as any,
      );

      const result = await emergencyService.adminDecide(
        "emergency-123",
        {
          decision: "APPROVE",
          resolution: "Granted due to executive priority",
        },
        "admin-123",
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.status).toBe(EmergencyStatus.APPROVED);
      }
    });
  });
});
