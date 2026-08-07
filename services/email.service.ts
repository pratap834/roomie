import * as React from "react";
import { after } from "next/server";
import type { EmailType } from "@prisma/client";
import { emailDefaults, resend } from "@/lib/resend";
import { env } from "@/lib/env";
import { emailLogRepository } from "@/repositories/email-log.repository";
import { calendarService } from "@/services/calendar.service";
import { createLogger } from "@/utils/logger";
import { formatDuration, toTimeString, durationMinutes } from "@/utils/time";
import { toISODate } from "@/utils/date";
import { formatFloorLabel, formatLocationLabel } from "@/utils/calendar";
import BookingConfirmationEmail from "@/emails/booking-confirmation";
import BookingCancellationEmail from "@/emails/booking-cancellation";
import BookingRescheduledEmail from "@/emails/booking-rescheduled";
import EmergencyRequestEmail from "@/emails/emergency-request";
import EmergencyApprovedEmail from "@/emails/emergency-approved";
import EmergencyRejectedEmail from "@/emails/emergency-rejected";
import type {
  BookingEmailDetails,
  EmailBrand,
  EmergencyEmailDetails,
} from "@/emails/types";

const log = createLogger("EmailService");

// ─────────────────────────────────────────────────────────────
// Domain-facing input types
// ─────────────────────────────────────────────────────────────

export interface EmailRecipient {
  id?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  department?: string | null;
}

export interface BookingEmailContext {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  attendeeCount: number;
  room: {
    name: string;
    code: string;
    floor: number;
    building: string | null;
  };
  organizer: EmailRecipient;
}

export interface EmergencyEmailContext {
  id: string;
  subject: string;
  description: string;
  priority: string;
  department?: string | null;
  requestedStartTime?: Date | null;
  requestedEndTime?: Date | null;
  requester: EmailRecipient;
}

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IEmailService {
  sendBookingConfirmation(booking: BookingEmailContext): void;
  sendBookingCancellation(params: {
    booking: BookingEmailContext;
    reason?: string | null;
    cancelledBy: EmailRecipient;
  }): void;
  sendBookingRescheduled(params: {
    booking: BookingEmailContext;
    previous: { date: Date; startTime: Date; endTime: Date; roomName: string };
    reason?: string | null;
    sequence?: number;
  }): void;
  sendEmergencyRequest(params: {
    emergency: EmergencyEmailContext;
    booking: BookingEmailContext;
  }): void;
  sendEmergencyApproved(params: {
    emergency: EmergencyEmailContext;
    booking: BookingEmailContext;
    outcome: string;
    note?: string | null;
  }): void;
  sendEmergencyRejected(params: {
    emergency: EmergencyEmailContext;
    reason?: string | null;
    contact?: { name: string; email: string } | null;
  }): void;
}

// ─────────────────────────────────────────────────────────────
// Presentation mappers
// ─────────────────────────────────────────────────────────────

const brand: EmailBrand = {
  appName: env.RESEND_FROM_NAME,
  appUrl: env.NEXT_PUBLIC_APP_URL,
};

function fullName(person: EmailRecipient): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

function formatWindow(start: Date, end: Date): string {
  return `${toTimeString(start)} – ${toTimeString(end)} UTC`;
}

function toBookingDetails(booking: BookingEmailContext): BookingEmailDetails {
  return {
    title: booking.title,
    roomName: booking.room.name,
    roomCode: booking.room.code,
    location: formatFloorLabel(booking.room),
    date: toISODate(booking.date),
    timeRange: formatWindow(booking.startTime, booking.endTime),
    duration: formatDuration(
      durationMinutes(booking.startTime, booking.endTime),
    ),
    attendeeCount: booking.attendeeCount,
    organizerName: fullName(booking.organizer),
  };
}

function toEmergencyDetails(
  emergency: EmergencyEmailContext,
): EmergencyEmailDetails {
  const hasWindow = Boolean(
    emergency.requestedStartTime && emergency.requestedEndTime,
  );

  return {
    id: emergency.id,
    subject: emergency.subject,
    reason: emergency.description,
    priority: emergency.priority,
    requesterName: fullName(emergency.requester),
    requesterEmail: emergency.requester.email,
    requesterDepartment:
      emergency.department ?? emergency.requester.department ?? "Not specified",
    requestedWindow: hasWindow
      ? `${toISODate(emergency.requestedStartTime!)} · ${formatWindow(
          emergency.requestedStartTime!,
          emergency.requestedEndTime!,
        )}`
      : null,
  };
}

/**
 * Builds a base64 ICS attachment for a booking. Returns undefined when
 * generation fails so a broken calendar file never blocks the email itself.
 */
function buildCalendarAttachment(
  booking: BookingEmailContext,
  options: { cancelled?: boolean; sequence?: number } = {},
): { filename: string; content: string }[] | undefined {
  const input = {
    uid: booking.id,
    title: booking.title,
    description: booking.description ?? undefined,
    location: formatLocationLabel(booking.room),
    start: booking.startTime,
    end: booking.endTime,
    organizer: {
      name: fullName(booking.organizer),
      email: booking.organizer.email,
    },
    sequence: options.sequence,
  };

  const result = options.cancelled
    ? calendarService.buildCancellation(input)
    : calendarService.buildEvent(input);

  if (!result.ok) {
    log.warn("Skipping calendar attachment", {
      bookingId: booking.id,
      code: result.code,
    });
    return undefined;
  }

  return [
    {
      filename: result.data.filename,
      content: Buffer.from(result.data.content, "utf-8").toString("base64"),
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// Dispatch primitives
// ─────────────────────────────────────────────────────────────

interface DispatchParams {
  type: EmailType;
  to: EmailRecipient;
  subject: string;
  template: React.JSX.Element;
  bookingId?: string | null;
  emergencyRequestId?: string | null;
  attachments?: { filename: string; content: string }[];
}

/**
 * Persists an EmailLog row, hands the payload to Resend, then reconciles the
 * log with the outcome. Every failure path is swallowed and logged: email
 * delivery is strictly best-effort and must never surface as an error to a
 * caller whose database transaction already committed.
 */
async function dispatch(params: DispatchParams): Promise<void> {
  let logId: string | null = null;

  try {
    const record = await emailLogRepository.create({
      type: params.type,
      toEmail: params.to.email,
      subject: params.subject,
      employeeId: params.to.id ?? null,
      bookingId: params.bookingId ?? null,
      emergencyRequestId: params.emergencyRequestId ?? null,
    });
    logId = record.id;
  } catch (error) {
    log.error("Failed to persist email log; sending anyway", error);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailDefaults.from,
      to: params.to.email,
      subject: params.subject,
      react: params.template,
      ...(params.attachments && { attachments: params.attachments }),
    });

    if (error) {
      throw new Error(error.message);
    }

    if (logId) {
      await emailLogRepository.markSent(logId, data?.id ?? null);
    }

    log.info("Email sent", { type: params.type, to: params.to.email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log.error("Failed to send email", { type: params.type, message });

    if (logId) {
      try {
        await emailLogRepository.markFailed(logId, message);
      } catch (logError) {
        log.error("Failed to record email failure", logError);
      }
    }
  }
}

/**
 * Schedules a dispatch to run after the HTTP response has been sent, so a slow
 * mail provider never extends an API response and never rolls back a committed
 * transaction.
 *
 * `after()` is what makes this safe on Vercel: a bare floating promise would be
 * killed when the serverless instance freezes on response, silently dropping
 * the email. Outside a request scope (e.g. a script) `after()` throws, so we
 * fall back to a floating promise. `dispatch` already swallows every error;
 * the extra catch only guarantees no unhandled rejection escapes.
 */
function dispatchAsync(params: DispatchParams): void {
  const run = () =>
    dispatch(params).catch((error) => {
      log.error("Unhandled email dispatch failure", error);
    });

  try {
    after(run);
  } catch {
    void run();
  }
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class EmailService implements IEmailService {
  sendBookingConfirmation(booking: BookingEmailContext): void {
    const details = toBookingDetails(booking);

    dispatchAsync({
      type: "BOOKING_CONFIRMATION",
      to: booking.organizer,
      subject: `Booking confirmed: ${booking.title} on ${details.date}`,
      bookingId: booking.id,
      attachments: buildCalendarAttachment(booking),
      template: React.createElement(BookingConfirmationEmail, {
        ...brand,
        recipientName: booking.organizer.firstName,
        booking: details,
      }),
    });
  }

  sendBookingCancellation(params: {
    booking: BookingEmailContext;
    reason?: string | null;
    cancelledBy: EmailRecipient;
  }): void {
    const { booking, reason, cancelledBy } = params;
    const details = toBookingDetails(booking);

    dispatchAsync({
      type: "BOOKING_CANCELLATION",
      to: booking.organizer,
      subject: `Booking cancelled: ${booking.title} on ${details.date}`,
      bookingId: booking.id,
      attachments: buildCalendarAttachment(booking, { cancelled: true }),
      template: React.createElement(BookingCancellationEmail, {
        ...brand,
        recipientName: booking.organizer.firstName,
        booking: details,
        reason: reason ?? null,
        cancelledBy:
          cancelledBy.id === booking.organizer.id
            ? "you"
            : fullName(cancelledBy),
      }),
    });
  }

  sendBookingRescheduled(params: {
    booking: BookingEmailContext;
    previous: { date: Date; startTime: Date; endTime: Date; roomName: string };
    reason?: string | null;
    sequence?: number;
  }): void {
    const { booking, previous, reason, sequence } = params;
    const details = toBookingDetails(booking);

    dispatchAsync({
      type: "BOOKING_RESCHEDULED",
      to: booking.organizer,
      subject: `Booking updated: ${booking.title} on ${details.date}`,
      bookingId: booking.id,
      attachments: buildCalendarAttachment(booking, {
        sequence: sequence ?? 1,
      }),
      template: React.createElement(BookingRescheduledEmail, {
        ...brand,
        recipientName: booking.organizer.firstName,
        booking: details,
        previous: {
          date: toISODate(previous.date),
          timeRange: formatWindow(previous.startTime, previous.endTime),
          roomName: previous.roomName,
        },
        reason: reason ?? null,
      }),
    });
  }

  sendEmergencyRequest(params: {
    emergency: EmergencyEmailContext;
    booking: BookingEmailContext;
  }): void {
    const { emergency, booking } = params;

    dispatchAsync({
      type: "EMERGENCY_CREATED",
      to: booking.organizer,
      subject: `Emergency room request: ${booking.room.name} on ${toISODate(
        booking.date,
      )}`,
      bookingId: booking.id,
      emergencyRequestId: emergency.id,
      template: React.createElement(EmergencyRequestEmail, {
        ...brand,
        recipientName: booking.organizer.firstName,
        booking: toBookingDetails(booking),
        emergency: toEmergencyDetails(emergency),
      }),
    });
  }

  sendEmergencyApproved(params: {
    emergency: EmergencyEmailContext;
    booking: BookingEmailContext;
    outcome: string;
    note?: string | null;
  }): void {
    const { emergency, booking, outcome, note } = params;

    dispatchAsync({
      type: "EMERGENCY_APPROVED",
      to: emergency.requester,
      subject: `Emergency request approved: ${outcome}`,
      bookingId: booking.id,
      emergencyRequestId: emergency.id,
      template: React.createElement(EmergencyApprovedEmail, {
        ...brand,
        recipientName: emergency.requester.firstName,
        emergency: toEmergencyDetails(emergency),
        booking: toBookingDetails(booking),
        outcome,
        note: note ?? null,
      }),
    });
  }

  sendEmergencyRejected(params: {
    emergency: EmergencyEmailContext;
    reason?: string | null;
    contact?: { name: string; email: string } | null;
  }): void {
    const { emergency, reason, contact } = params;

    dispatchAsync({
      type: "EMERGENCY_REJECTED",
      to: emergency.requester,
      subject: `Emergency request declined: ${emergency.subject}`,
      emergencyRequestId: emergency.id,
      template: React.createElement(EmergencyRejectedEmail, {
        ...brand,
        recipientName: emergency.requester.firstName,
        emergency: toEmergencyDetails(emergency),
        reason: reason ?? null,
        contact: contact ?? null,
      }),
    });
  }
}

export const emailService = new EmailService();
