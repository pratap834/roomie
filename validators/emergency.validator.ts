import { z } from "zod";
import {
  EmergencyAction,
  EmergencyPriority,
  EmergencyStatus,
} from "@prisma/client";
import {
  MIN_BOOKING_DURATION_MINUTES,
  MAX_BOOKING_DURATION_MINUTES,
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

// ─────────────────────────────────────────────────────────────
// Create Emergency Override Request
// ─────────────────────────────────────────────────────────────

export const createEmergencyRequestSchema = z
  .object({
    bookingId: z.string().uuid("bookingId must be a valid UUID"),
    subject: z
      .string()
      .min(5, "Subject must be at least 5 characters")
      .max(150, "Subject must not exceed 150 characters")
      .trim(),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason must not exceed 1000 characters")
      .trim(),
    department: z.string().min(1).max(100).trim().optional(),
    requestedStartTime: isoDateTimeString.optional(),
    requestedEndTime: isoDateTimeString.optional(),
    priority: z.nativeEnum(EmergencyPriority).default(EmergencyPriority.MEDIUM),
  })
  .superRefine((data, ctx) => {
    const { requestedStartTime, requestedEndTime } = data;

    if (Boolean(requestedStartTime) !== Boolean(requestedEndTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "requestedStartTime and requestedEndTime must both be provided together",
        path: ["requestedEndTime"],
      });
      return;
    }

    if (!requestedStartTime || !requestedEndTime) return;

    const start = new Date(requestedStartTime);
    const end = new Date(requestedEndTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "requestedEndTime must be after requestedStartTime",
        path: ["requestedEndTime"],
      });
      return;
    }

    const minutes = durationMinutes(start, end);

    if (minutes < MIN_BOOKING_DURATION_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Requested window must be at least ${MIN_BOOKING_DURATION_MINUTES} minutes`,
        path: ["requestedEndTime"],
      });
    }

    if (minutes > MAX_BOOKING_DURATION_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Requested window cannot exceed ${MAX_BOOKING_DURATION_MINUTES} minutes`,
        path: ["requestedEndTime"],
      });
    }
  });

export type CreateEmergencyRequestInput = z.infer<
  typeof createEmergencyRequestSchema
>;

// ─────────────────────────────────────────────────────────────
// Approval / resolution actions
//
// Each action carries a different payload, so the schema is a discriminated
// union — this makes an incomplete payload (e.g. ROOM_TRANSFER without a
// target room) a validation error rather than a runtime service failure.
// ─────────────────────────────────────────────────────────────

const decisionNote = z.string().min(1).max(500).trim().optional();

const keepBookingSchema = z.object({
  action: z.literal(EmergencyAction.KEEP_BOOKING),
  note: decisionNote,
});

const contactEmployeeSchema = z.object({
  action: z.literal(EmergencyAction.CONTACT_EMPLOYEE),
  note: decisionNote,
});

const roomTransferSchema = z.object({
  action: z.literal(EmergencyAction.ROOM_TRANSFER),
  targetRoomId: z.string().uuid("targetRoomId must be a valid UUID"),
  note: decisionNote,
});

const rescheduleSchema = z.object({
  action: z.literal(EmergencyAction.RESCHEDULE),
  date: isoDateString,
  startTime: isoDateTimeString,
  endTime: isoDateTimeString,
  note: decisionNote,
});

const reduceDurationSchema = z.object({
  action: z.literal(EmergencyAction.REDUCE_DURATION),
  /** New end time — must fall strictly inside the current booking window. */
  endTime: isoDateTimeString,
  note: decisionNote,
});

/**
 * Cross-field checks for RESCHEDULE live on the union rather than on the
 * member schema: z.discriminatedUnion only accepts plain object schemas, so
 * wrapping a member in superRefine would break discrimination.
 */
export const resolveEmergencyRequestSchema = z
  .discriminatedUnion("action", [
    keepBookingSchema,
    contactEmployeeSchema,
    roomTransferSchema,
    rescheduleSchema,
    reduceDurationSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.action !== EmergencyAction.RESCHEDULE) return;

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (toISODate(start) !== data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "date must match the date portion of startTime",
        path: ["date"],
      });
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "endTime must be after startTime",
        path: ["endTime"],
      });
      return;
    }

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
  });

export type ResolveEmergencyRequestInput = z.infer<
  typeof resolveEmergencyRequestSchema
>;

// ─────────────────────────────────────────────────────────────
// Admin approve / reject
// ─────────────────────────────────────────────────────────────

export const adminEmergencyDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"], {
    required_error: "decision is required",
    invalid_type_error: "decision must be APPROVE or REJECT",
  }),
  resolution: z
    .string()
    .min(5, "Resolution must be at least 5 characters")
    .max(500)
    .trim()
    .optional(),
});

export type AdminEmergencyDecisionInput = z.infer<
  typeof adminEmergencyDecisionSchema
>;

// ─────────────────────────────────────────────────────────────
// Emergency list/filter query params
// ─────────────────────────────────────────────────────────────

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === "" ? undefined : val), schema.optional());

export const emergencyFiltersSchema = z.object({
  status: emptyToUndefined(z.nativeEnum(EmergencyStatus)),
  priority: emptyToUndefined(z.nativeEnum(EmergencyPriority)),
  employeeId: emptyToUndefined(z.string().uuid()),
  roomId: emptyToUndefined(z.string().uuid()),
  bookingId: emptyToUndefined(z.string().uuid()),
  scope: emptyToUndefined(z.enum(["my_requests", "incoming", "all"])),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type EmergencyFiltersInput = z.infer<typeof emergencyFiltersSchema>;
