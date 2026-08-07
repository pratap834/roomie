import { describe, it, expect } from "vitest";
import { parseISODate, toISODate, rangesOverlap, diffInMinutes } from "@/utils/date";
import { durationMinutes, formatDuration, toTimeString } from "@/utils/time";

describe("Date Utilities", () => {
  it("toISODate formats Date objects as YYYY-MM-DD", () => {
    const d = new Date("2026-08-04T10:30:00.000Z");
    expect(toISODate(d)).toBe("2026-08-04");
  });

  it("parseISODate parses YYYY-MM-DD string as UTC midnight Date", () => {
    const parsed = parseISODate("2026-08-04");
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(7); // 0-indexed August
    expect(parsed.getUTCDate()).toBe(4);
    expect(parsed.getUTCHours()).toBe(0);
  });

  it("rangesOverlap correctly detects overlapping time ranges", () => {
    const a1 = new Date("2026-08-04T10:00:00Z");
    const a2 = new Date("2026-08-04T11:00:00Z");
    const b1 = new Date("2026-08-04T10:30:00Z");
    const b2 = new Date("2026-08-04T11:30:00Z");
    const c1 = new Date("2026-08-04T11:00:00Z");
    const c2 = new Date("2026-08-04T12:00:00Z");

    expect(rangesOverlap(a1, a2, b1, b2)).toBe(true);
    expect(rangesOverlap(a1, a2, c1, c2)).toBe(false); // Touching edges don't overlap
  });

  it("diffInMinutes returns correct minute difference", () => {
    const start = new Date("2026-08-04T10:00:00.000Z");
    const end = new Date("2026-08-04T10:45:00.000Z");
    expect(diffInMinutes(start, end)).toBe(45);
  });
});

describe("Time Utilities", () => {
  it("durationMinutes calculates exact minute difference", () => {
    const start = new Date("2026-08-04T10:00:00.000Z");
    const end = new Date("2026-08-04T11:30:00.000Z");
    expect(durationMinutes(start, end)).toBe(90);
  });

  it("formatDuration formats minutes into h/m notation", () => {
    expect(formatDuration(30)).toBe("30m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(120)).toBe("2h");
  });

  it("toTimeString formats UTC hours and minutes as HH:MM", () => {
    const d = new Date("2026-08-04T14:05:00.000Z");
    expect(toTimeString(d)).toBe("14:05");
  });
});
