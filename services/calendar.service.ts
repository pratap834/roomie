import { createLogger } from "@/utils/logger";
import { ICS_PRODID, ICS_UID_DOMAIN } from "@/utils/constants";
import type { ServiceResult } from "@/types";

const log = createLogger("CalendarService");

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export type CalendarEventMethod = "REQUEST" | "CANCEL";

export type CalendarEventStatus = "CONFIRMED" | "CANCELLED" | "TENTATIVE";

export interface CalendarAttendee {
  name: string;
  email: string;
}

export interface CalendarEventInput {
  /** Stable identifier — the booking ID, so updates replace prior invites. */
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  organizer: CalendarAttendee;
  attendees?: CalendarAttendee[];
  status?: CalendarEventStatus;
  method?: CalendarEventMethod;
  /** Incremented on each update so calendar clients supersede the old event. */
  sequence?: number;
}

export interface CalendarFile {
  filename: string;
  content: string;
  contentType: string;
}

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface ICalendarService {
  buildEvent(input: CalendarEventInput): ServiceResult<CalendarFile>;
  buildCancellation(input: CalendarEventInput): ServiceResult<CalendarFile>;
}

// ─────────────────────────────────────────────────────────────
// RFC 5545 helpers
// ─────────────────────────────────────────────────────────────

/**
 * Formats a Date as a UTC iCalendar timestamp (YYYYMMDDTHHMMSSZ).
 */
function toICSTimestamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/**
 * Escapes a TEXT value per RFC 5545 §3.3.11. Backslashes must be escaped
 * first, otherwise the escapes introduced below would be double-escaped.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/**
 * Folds a content line to 75 octets per RFC 5545 §3.1. Folding operates on
 * UTF-8 byte length, not character count, so multi-byte characters in a
 * meeting title cannot push a line over the limit.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);

  if (bytes.length <= 75) return line;

  const decoder = new TextDecoder();
  const segments: string[] = [];
  let offset = 0;
  // First line takes 75 octets; continuation lines are prefixed with a space
  // which itself counts toward the limit, leaving 74.
  let limit = 75;

  while (offset < bytes.length) {
    let take = Math.min(limit, bytes.length - offset);

    // Never split a multi-byte sequence: walk back off continuation bytes.
    while (take > 0 && (bytes[offset + take]! & 0xc0) === 0x80) {
      take -= 1;
    }
    if (take === 0) take = Math.min(limit, bytes.length - offset);

    segments.push(decoder.decode(bytes.subarray(offset, offset + take)));
    offset += take;
    limit = 74;
  }

  return segments.join("\r\n ");
}

function line(name: string, value: string): string {
  return foldLine(`${name}:${value}`);
}

function sanitizeFilename(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug.length > 0 ? slug : "booking";
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class CalendarService implements ICalendarService {
  /**
   * Builds a downloadable VEVENT compatible with Google Calendar, Outlook,
   * and Apple Calendar. No external calendar API is contacted.
   */
  buildEvent(input: CalendarEventInput): ServiceResult<CalendarFile> {
    try {
      if (!(input.start instanceof Date) || Number.isNaN(input.start.getTime())) {
        return {
          ok: false,
          error: "Invalid event start time",
          code: "CALENDAR_GENERATION_FAILED",
        };
      }

      if (!(input.end instanceof Date) || Number.isNaN(input.end.getTime())) {
        return {
          ok: false,
          error: "Invalid event end time",
          code: "CALENDAR_GENERATION_FAILED",
        };
      }

      if (input.end <= input.start) {
        return {
          ok: false,
          error: "Event end time must be after the start time",
          code: "CALENDAR_GENERATION_FAILED",
        };
      }

      const stamp = toICSTimestamp(new Date());
      const status: CalendarEventStatus = input.status ?? "CONFIRMED";
      const method: CalendarEventMethod = input.method ?? "REQUEST";

      const lines: string[] = [
        "BEGIN:VCALENDAR",
        line("VERSION", "2.0"),
        line("PRODID", ICS_PRODID),
        line("CALSCALE", "GREGORIAN"),
        line("METHOD", method),
        "BEGIN:VEVENT",
        line("UID", `${input.uid}@${ICS_UID_DOMAIN}`),
        line("DTSTAMP", stamp),
        line("DTSTART", toICSTimestamp(input.start)),
        line("DTEND", toICSTimestamp(input.end)),
        line("SUMMARY", escapeText(input.title)),
        line("SEQUENCE", String(input.sequence ?? 0)),
        line("STATUS", status),
        line("TRANSP", status === "CANCELLED" ? "TRANSPARENT" : "OPAQUE"),
      ];

      if (input.description) {
        lines.push(line("DESCRIPTION", escapeText(input.description)));
      }

      if (input.location) {
        lines.push(line("LOCATION", escapeText(input.location)));
      }

      lines.push(
        line(
          "ORGANIZER;CN=" + escapeText(input.organizer.name),
          `mailto:${input.organizer.email}`,
        ),
      );

      for (const attendee of input.attendees ?? []) {
        lines.push(
          line(
            "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=" +
              escapeText(attendee.name),
            `mailto:${attendee.email}`,
          ),
        );
      }

      lines.push("END:VEVENT", "END:VCALENDAR");

      return {
        ok: true,
        data: {
          filename: `${sanitizeFilename(input.title)}.ics`,
          // RFC 5545 requires CRLF line endings and a trailing break.
          content: `${lines.join("\r\n")}\r\n`,
          contentType: "text/calendar; charset=utf-8",
        },
      };
    } catch (error) {
      log.error("Failed to generate ICS event", error);
      return {
        ok: false,
        error: "Failed to generate calendar file",
        code: "CALENDAR_GENERATION_FAILED",
      };
    }
  }

  /**
   * Builds a cancellation invite. Calendar clients remove the matching event
   * when SEQUENCE is higher than the invite they already hold, so callers
   * should pass an incremented sequence.
   */
  buildCancellation(input: CalendarEventInput): ServiceResult<CalendarFile> {
    return this.buildEvent({
      ...input,
      status: "CANCELLED",
      method: "CANCEL",
      sequence: input.sequence ?? 1,
    });
  }
}

export const calendarService = new CalendarService();
