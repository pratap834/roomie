import { describe, it, expect } from "vitest";
import { calendarService } from "@/services/calendar.service";

describe("CalendarService", () => {
  const start = new Date("2026-08-04T10:00:00.000Z");
  const end = new Date("2026-08-04T11:00:00.000Z");

  it("builds a valid RFC 5545 iCalendar (.ics) file string", () => {
    const result = calendarService.buildEvent({
      uid: "booking-123",
      title: "Quarterly Strategy Sync",
      description: "Discuss Q3 OKRs and resource allocation",
      location: "Building A, Floor 3, Room 301 (Boardroom Alpha)",
      start,
      end,
      organizer: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
      },
      attendees: [
        { name: "John Smith", email: "john.smith@example.com" },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.filename).toBe("quarterly-strategy-sync.ics");
      expect(result.data.contentType).toBe("text/calendar; charset=utf-8");
      expect(result.data.content).toContain("BEGIN:VCALENDAR");
      expect(result.data.content).toContain("BEGIN:VEVENT");
      expect(result.data.content).toContain("UID:booking-123@room-booking-system");
      expect(result.data.content).toContain("SUMMARY:Quarterly Strategy Sync");
      expect(result.data.content).toContain("ORGANIZER;CN=Jane Doe:mailto:jane.doe@example.com");
      // The line is folded per RFC 5545 at 75 octets; check prefix before fold
      expect(result.data.content).toContain("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=");
      expect(result.data.content).toContain("END:VEVENT");
      expect(result.data.content).toContain("END:VCALENDAR");
    }
  });

  it("builds a cancellation invite with METHOD:CANCEL and STATUS:CANCELLED", () => {
    const result = calendarService.buildCancellation({
      uid: "booking-123",
      title: "Quarterly Strategy Sync",
      start,
      end,
      organizer: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
      },
      sequence: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.content).toContain("METHOD:CANCEL");
      expect(result.data.content).toContain("STATUS:CANCELLED");
      expect(result.data.content).toContain("SEQUENCE:1");
    }
  });

  it("handles line folding correctly for long strings", () => {
    const result = calendarService.buildEvent({
      uid: "booking-456",
      title: "Very Long Meeting Title That Exceeds The RFC 5545 Octet Line Limit For Content Line Folding Demonstration",
      start,
      end,
      organizer: {
        name: "Jane Doe",
        email: "jane.doe@example.com",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Lines folded according to RFC 5545 have CRLF followed by a space
      expect(result.data.content).toMatch(/\r\n /);
    }
  });

  it("rejects event creation when end time is before start time", () => {
    const result = calendarService.buildEvent({
      uid: "booking-789",
      title: "Invalid Window",
      start: end,
      end: start,
      organizer: { name: "Jane", email: "jane@example.com" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("CALENDAR_GENERATION_FAILED");
    }
  });
});
