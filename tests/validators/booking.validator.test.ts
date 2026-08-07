import { describe, it, expect } from "vitest";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  bookingFiltersSchema,
  availabilityQuerySchema,
} from "@/validators/booking.validator";
import { BookingPriority, BookingStatus } from "@prisma/client";

describe("Booking Validators", () => {
  const validUUID = "123e4567-e89b-12d3-a456-426614174000";

  it("validates valid createBookingSchema input", () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000); // 1 hr from now
    const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000); // 2 hrs from now

    const isoDate = futureStart.toISOString().split("T")[0];

    const input = {
      title: "Sprint Planning",
      reason: "Bi-weekly team sync meeting",
      roomId: validUUID,
      date: isoDate,
      startTime: futureStart.toISOString(),
      endTime: futureEnd.toISOString(),
      attendeeCount: 5,
      priority: BookingPriority.HIGH,
    };

    const parsed = createBookingSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects booking creation if start time is less than advance notice", () => {
    const immediateStart = new Date(Date.now() + 1 * 60 * 1000); // 1 min from now (min notice is 5 min)
    const immediateEnd = new Date(immediateStart.getTime() + 60 * 60 * 1000);
    const isoDate = immediateStart.toISOString().split("T")[0];

    const input = {
      title: "Urgent Sync",
      reason: "Immediate discussion",
      roomId: validUUID,
      date: isoDate,
      startTime: immediateStart.toISOString(),
      endTime: immediateEnd.toISOString(),
      attendeeCount: 3,
    };

    const parsed = createBookingSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toContain("at least 5 minutes");
    }
  });

  it("rejects booking creation if end time is before start time", () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() - 30 * 60 * 1000);
    const isoDate = futureStart.toISOString().split("T")[0];

    const input = {
      title: "Invalid Window",
      reason: "Testing backwards time",
      roomId: validUUID,
      date: isoDate,
      startTime: futureStart.toISOString(),
      endTime: futureEnd.toISOString(),
      attendeeCount: 2,
    };

    const parsed = createBookingSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates updateBookingSchema input", () => {
    const input = {
      title: "Updated Title",
      attendeeCount: 10,
    };
    const parsed = updateBookingSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects updateBookingSchema if empty object is provided", () => {
    const parsed = updateBookingSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("validates cancelBookingSchema with or without reason", () => {
    expect(cancelBookingSchema.safeParse({}).success).toBe(true);
    expect(
      cancelBookingSchema.safeParse({ reason: "Scheduling conflict" }).success,
    ).toBe(true);
    expect(cancelBookingSchema.safeParse({ reason: "Soon" }).success).toBe(
      false,
    ); // 4 chars — below 5-char minimum
  });

  it("validates availabilityQuerySchema", () => {
    const futureStart = new Date(Date.now() + 60 * 60 * 1000);
    const futureEnd = new Date(futureStart.getTime() + 30 * 60 * 1000);
    const isoDate = futureStart.toISOString().split("T")[0];

    const query = {
      date: isoDate,
      startTime: futureStart.toISOString(),
      endTime: futureEnd.toISOString(),
    };

    const parsed = availabilityQuerySchema.safeParse(query);
    expect(parsed.success).toBe(true);
  });
});
