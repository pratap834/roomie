import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingService } from "@/services/booking.service";
import { bookingRepository } from "@/repositories/booking.repository";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/services/email.service";
import { BookingPriority, BookingStatus, RoomStatus } from "@prisma/client";

vi.mock("@/repositories/booking.repository", () => ({
  bookingRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findOverlapping: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    addHistory: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/services/email.service", () => ({
  emailService: {
    sendBookingConfirmation: vi.fn(),
    sendBookingRescheduled: vi.fn(),
    sendBookingCancellation: vi.fn(),
  },
}));

describe("BookingService", () => {
  let bookingService: BookingService;

  const mockBooking = {
    id: "booking-123",
    title: "Sprint Review",
    description: "End of sprint demo",
    date: new Date("2026-08-10"),
    startTime: new Date("2026-08-10T10:00:00.000Z"),
    endTime: new Date("2026-08-10T11:00:00.000Z"),
    attendeeCount: 6,
    priority: BookingPriority.MEDIUM,
    status: BookingStatus.CONFIRMED,
    notes: null,
    approvedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    completedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    employeeId: "employee-123",
    roomId: "room-123",
    approvedById: null,
    employee: {
      id: "employee-123",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      department: "Engineering",
    },
    room: {
      id: "room-123",
      name: "Conference Room 101",
      code: "CONF_101",
      floor: 1,
      building: "Main Building",
      capacity: 10,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    bookingService = new BookingService();
  });

  it("getBookingById returns FORBIDDEN if requester is not owner and not admin", async () => {
    vi.mocked(bookingRepository.findById).mockResolvedValue(mockBooking as any);

    const result = await bookingService.getBookingById(
      "booking-123",
      "other-employee-id",
      false, // isAdmin = false
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FORBIDDEN");
    }
  });

  it("getBookingById succeeds when requester is the owner", async () => {
    vi.mocked(bookingRepository.findById).mockResolvedValue(mockBooking as any);

    const result = await bookingService.getBookingById(
      "booking-123",
      "employee-123",
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("Sprint Review");
    }
  });

  it("createBooking throws BOOKING_CONFLICT if room is already booked", async () => {
    const fakeTx = {
      room: {
        findFirst: vi.fn().mockResolvedValue({
          id: "room-123",
          isActive: true,
          status: RoomStatus.AVAILABLE,
        }),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return callback(fakeTx);
    });

    vi.mocked(bookingRepository.findOverlapping).mockResolvedValue(mockBooking as any);

    const input = {
      title: "Design Sync",
      reason: "UI design review",
      roomId: "room-123",
      date: "2026-08-10",
      startTime: "2026-08-10T10:00:00.000Z",
      endTime: "2026-08-10T11:00:00.000Z",
      attendeeCount: 4,
      priority: BookingPriority.MEDIUM,
    };

    const result = await bookingService.createBooking(input, "employee-123");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("BOOKING_CONFLICT");
    }
  });

  it("cancelBooking updates status to CANCELLED and records history", async () => {
    vi.mocked(bookingRepository.findById).mockResolvedValue(mockBooking as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return callback({});
    });
    vi.mocked(bookingRepository.updateStatus).mockResolvedValue({
      ...mockBooking,
      status: BookingStatus.CANCELLED,
    } as any);

    const result = await bookingService.cancelBooking(
      "booking-123",
      { reason: "Meeting no longer needed" },
      "employee-123",
      false,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(BookingStatus.CANCELLED);
    }
  });
});
