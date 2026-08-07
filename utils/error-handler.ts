import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createLogger } from "@/utils/logger";
import {
  unauthorized,
  forbidden,
  notFound,
  validationError,
  internalError,
  conflict,
  badRequest,
} from "@/utils/api-response";
import type { ApiError } from "@/types";

const log = createLogger("ErrorHandler");

// ─────────────────────────────────────────────────────────────
// Typed error strings thrown by services / auth
// ─────────────────────────────────────────────────────────────

const ERROR_MAP: Record<string, () => NextResponse<ApiError>> = {
  UNAUTHORIZED: () => unauthorized(),
  FORBIDDEN: () => forbidden(),
  EMPLOYEE_NOT_FOUND: () => notFound("Employee record not found"),
  ROOM_NOT_FOUND: () => notFound("Room not found"),
  BOOKING_NOT_FOUND: () => notFound("Booking not found"),
  ROOM_CODE_EXISTS: () => conflict("A room with this code already exists"),
  ROOM_UNAVAILABLE: () => conflict("Room is not available for booking"),
  BOOKING_CONFLICT: () =>
    conflict("The room is already booked for this time slot"),
  BOOKING_INVALID_STATUS: () =>
    conflict("This action cannot be performed on a booking in its current status"),
  BOOKING_PAST: () => badRequest("Cannot modify a booking that has already started"),
  BOOKING_INVALID_TIME: () => badRequest("End time must be after start time"),
  EMPLOYEE_EXISTS: () => conflict("An employee with this email already exists"),
  EMERGENCY_NOT_FOUND: () => notFound("Emergency request not found"),
  EMERGENCY_DUPLICATE: () =>
    conflict("A pending emergency request already exists for this booking"),
  EMERGENCY_INVALID_STATUS: () =>
    conflict("This emergency request has already been decided"),
  EMERGENCY_INVALID_ACTION: () =>
    badRequest("The requested approval action cannot be applied to this booking"),
  EMERGENCY_OWN_BOOKING: () =>
    badRequest("You cannot raise an emergency request against your own booking"),
  CALENDAR_GENERATION_FAILED: () =>
    internalError("Failed to generate the calendar file"),
};

/**
 * Central error handler for API route catch blocks.
 * Maps well-known error strings and Zod errors to typed HTTP responses.
 */
export function handleApiError(
  error: unknown,
  context?: string,
): NextResponse<ApiError> {
  if (error instanceof ZodError) {
    const details = formatZodError(error);
    return validationError("Validation failed", details);
  }

  if (error instanceof Error) {
    const handler = ERROR_MAP[error.message];
    if (handler) return handler();

    log.error(`Unhandled error${context ? ` in ${context}` : ""}`, error);
    return internalError();
  }

  log.error(`Unknown error type${context ? ` in ${context}` : ""}`, error);
  return internalError();
}

/**
 * Formats a ZodError into a field-keyed details map.
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!details[path]) details[path] = [];
    details[path]!.push(issue.message);
  }

  return details;
}

/**
 * Validates a request body JSON against a Zod schema.
 * Returns { data } on success or a NextResponse on failure.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: { parseAsync: (data: unknown) => Promise<T> },
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<ApiError> }> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return {
      data: null,
      error: badRequest("Request body must be valid JSON"),
    };
  }

  try {
    const data = await schema.parseAsync(raw);
    return { data, error: null };
  } catch (err) {
    if (err instanceof ZodError) {
      return {
        data: null,
        error: validationError("Validation failed", formatZodError(err)),
      };
    }
    return { data: null, error: internalError() };
  }
}
