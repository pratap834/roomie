/**
 * Returns midnight UTC for a given date.
 */
export function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Returns true if two date ranges overlap.
 * Range is [startA, endA) vs [startB, endB).
 */
export function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Formats a Date to ISO date string "YYYY-MM-DD".
 */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * Parses a "YYYY-MM-DD" string into a Date at midnight UTC.
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year!, (month! - 1), day!));
}

/**
 * Returns true if the given date is today (UTC).
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}

/**
 * Returns true if the given date is in the past (UTC).
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Returns true if the given date is in the future (UTC).
 */
export function isFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Returns the start of day (00:00:00.000) in UTC.
 */
export function startOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Returns the end of day (23:59:59.999) in UTC.
 */
export function endOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

/**
 * Adds the specified number of minutes to a date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/**
 * Returns the difference in minutes between two dates.
 */
export function diffInMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60_000);
}

/**
 * Returns the difference in days between two dates.
 */
export function diffInDays(start: Date, end: Date): number {
  return Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
}
