import { z } from "zod";
import { BookingStatus, BookingPriority } from "@prisma/client";
import {
  MIN_BOOKING_DURATION_MINUTES,
  MAX_BOOKING_DURATION_MINUTES,
  MAX_ADVANCE_BOOKING_DAYS,
  MIN_ADVANCE_NOTICE_MINUTES,
} from "@/utils/constants";
import { durationMinutes } from "@/utils/time";
import { toISODate } from "@/utils/date";

// ─────────────────────────────────────────────────────────────
// Shared field schemas
// ─────────────────────────────────────────────────────────────

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const isoDateTimeString = z
  .string()
  .datetime({ offset: true, message: "Must be a valid ISO 8601 datetime string" });

/**
 * Shared cross-field validation for a start/end/date combination.
 * Reused by both create and update flows.
 */
function validateBookingWindow(
  data: { date?: string; startTime?: string; endTime?: string },
  ctx: z.RefinementCtx,
  options: { requireFields: boolean },
): void {
  const { date, startTime, endTime } = data;

  if (options.requireFields && (!date || !startTime || !endTime)) {
    // required() already enforces presence on create; nothing further to do here.
    return;
  }

  if (!startTime || !endTime) return;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (date && toISODate(start) !== date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "date must match the date portion of startTime",
      path: ["date"],
    });
  }

  const minStart = new Date(now.getTime() + MIN_ADVANCE_NOTICE_MINUTES * 60_000);
  if (start < minStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Start time must be at least ${MIN_ADVANCE_NOTICE_MINUTES} minutes from now`,
      path: ["startTime"],
    });
  }

  if (end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time must be after start time",
      path: ["endTime"],
    });
    // Duration checks below are meaningless once end <= start; skip them.
    return;
  }

  // Note: end <= start (which would imply a non-positive duration) is
  // already rejected above, so `minutes` here is guaranteed positive.
  const minutes = durationMinutes(start, end);

  if (minutes < MIN_BOOKING_DURATION_MINUTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Booking must be at least ${MIN_BOOKING_DURATION_MINUTES} minutes`,
      path: ["endTime"],
    });
  }

  if (minutes > MAX_BOOKING_DURATION_MINUTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Booking cannot exceed ${MAX_BOOKING_DURATION_MINUTES} minutes`,
      path: ["endTime"],
    });
  }

  const advanceDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (advanceDays > MAX_ADVANCE_BOOKING_DAYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Booking cannot be made more than ${MAX_ADVANCE_BOOKING_DAYS} days in advance`,
      path: ["startTime"],
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Create Booking
// ─────────────────────────────────────────────────────────────

export const createBookingSchema = z
  .object({
    title: z
      .string()
      .min(2, "Meeting title must be at least 2 characters")
      .max(150, "Meeting title must not exceed 150 characters")
      .trim(),
    reason: z
      .string()
      .min(5, "Booking reason must be at least 5 characters")
      .max(1000, "Booking reason must not exceed 1000 characters")
      .trim()
      .optional(),
    roomId: z.string().uuid("roomId must be a valid UUID"),
    date: isoDateString,
    startTime: isoDateTimeString,
    endTime: isoDateTimeString,
    attendeeCount: z
      .number({ required_error: "Expected participants is required" })
      .int()
      .min(1, "At least 1 participant is required")
      .max(1000),
    priority: z.nativeEnum(BookingPriority).default(BookingPriority.MEDIUM),
    notes: z.string().max(500).trim().optional(),
  })
  .superRefine((data, ctx) =>
    validateBookingWindow(data, ctx, { requireFields: true }),
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ─────────────────────────────────────────────────────────────
// Update Booking
// ─────────────────────────────────────────────────────────────

export const updateBookingSchema = z
  .object({
    title: z.string().min(2).max(150).trim().optional(),
    reason: z.string().min(5).max(1000).trim().optional(),
    date: isoDateString.optional(),
    startTime: isoDateTimeString.optional(),
    endTime: isoDateTimeString.optional(),
    attendeeCount: z.number().int().min(1).max(1000).optional(),
    priority: z.nativeEnum(BookingPriority).optional(),
    notes: z.string().max(500).trim().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update",
  )
  .superRefine((data, ctx) => {
    // Only re-validate the time window if any of its constituent fields changed.
    if (data.date || data.startTime || data.endTime) {
      validateBookingWindow(data, ctx, { requireFields: false });
    }
  });

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ─────────────────────────────────────────────────────────────
// Cancel Booking
// ─────────────────────────────────────────────────────────────

export const cancelBookingSchema = z.object({
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500)
    .trim()
    .optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ─────────────────────────────────────────────────────────────
// Booking list/filter query params
// ─────────────────────────────────────────────────────────────

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema.optional());

export const bookingFiltersSchema = z.object({
  status: emptyToUndefined(z.nativeEnum(BookingStatus)),
  employeeId: emptyToUndefined(z.string().uuid()),
  roomId: emptyToUndefined(z.string().uuid()),
  dateFrom: emptyToUndefined(isoDateString),
  dateTo: emptyToUndefined(isoDateString),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type BookingFiltersInput = z.infer<typeof bookingFiltersSchema>;

// ─────────────────────────────────────────────────────────────
// Room availability query params
// ─────────────────────────────────────────────────────────────

export const availabilityQuerySchema = z
  .object({
    date: isoDateString,
    startTime: isoDateTimeString,
    endTime: isoDateTimeString,
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
