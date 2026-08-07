/**
 * Formats a Date to "HH:MM" (24-hour UTC).
 */
export function toTimeString(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Parses an "HH:MM" string into { hours, minutes }.
 */
export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Combines a Date (for the day) and an "HH:MM" time string into a single Date (UTC).
 */
export function combineDateAndTime(date: Date, time: string): Date {
  const { hours, minutes } = parseTimeString(time);
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );
}

/**
 * Returns true if start time is strictly before end time.
 */
export function isValidTimeRange(start: Date, end: Date): boolean {
  return start < end;
}

/**
 * Returns duration in minutes between two time values.
 */
export function durationMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60_000);
}

/**
 * Formats minutes into a human-readable string like "1h 30m".
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Returns a list of time slots between start and end with the given interval (minutes).
 */
export function generateTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes: number,
): string[] {
  const slots: string[] = [];
  let current = startHour * 60;
  const end = endHour * 60;

  while (current < end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += intervalMinutes;
  }

  return slots;
}
