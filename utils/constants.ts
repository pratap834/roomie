// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─────────────────────────────────────────────────────────────
// Booking constraints
// ─────────────────────────────────────────────────────────────

/** Minimum booking duration in minutes */
export const MIN_BOOKING_DURATION_MINUTES = 15;

/** Maximum booking duration in minutes (8 hours) */
export const MAX_BOOKING_DURATION_MINUTES = 480;

/** How far in advance (days) a booking can be made */
export const MAX_ADVANCE_BOOKING_DAYS = 90;

/** Minimum notice (minutes) required before a booking */
export const MIN_ADVANCE_NOTICE_MINUTES = 5;

// ─────────────────────────────────────────────────────────────
// Business hours (UTC hour boundaries)
// ─────────────────────────────────────────────────────────────

export const BUSINESS_HOURS_START = 8;   // 08:00
export const BUSINESS_HOURS_END = 20;    // 20:00

// ─────────────────────────────────────────────────────────────
// API route prefixes
// ─────────────────────────────────────────────────────────────

export const API_PREFIX = "/api";

export const ROUTES = {
  ROOMS: `${API_PREFIX}/rooms`,
  BOOKINGS: `${API_PREFIX}/bookings`,
  EMPLOYEES: `${API_PREFIX}/employees`,
  EMERGENCY: `${API_PREFIX}/emergency`,
  ADMIN: `${API_PREFIX}/admin`,
  HEALTH: `${API_PREFIX}/health`,
} as const;

// ─────────────────────────────────────────────────────────────
// Calendar (ICS)
// ─────────────────────────────────────────────────────────────

/** Stable domain suffix used to build RFC 5545 UIDs. */
export const ICS_UID_DOMAIN = "room-booking-system";

/** PRODID advertised in generated ICS files. */
export const ICS_PRODID = "-//Room Booking System//Bookings//EN";

// ─────────────────────────────────────────────────────────────
// Error codes
// ─────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  EMPLOYEE_NOT_FOUND: "EMPLOYEE_NOT_FOUND",

  // Generic
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",

  // Room
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",
  ROOM_UNAVAILABLE: "ROOM_UNAVAILABLE",
  ROOM_CODE_EXISTS: "ROOM_CODE_EXISTS",

  // Booking
  BOOKING_NOT_FOUND: "BOOKING_NOT_FOUND",
  BOOKING_CONFLICT: "BOOKING_CONFLICT",
  BOOKING_PAST: "BOOKING_PAST",
  BOOKING_INVALID_TIME: "BOOKING_INVALID_TIME",
  BOOKING_DURATION_EXCEEDED: "BOOKING_DURATION_EXCEEDED",
  BOOKING_INVALID_STATUS: "BOOKING_INVALID_STATUS",

  // Employee
  EMPLOYEE_EXISTS: "EMPLOYEE_EXISTS",
  EMPLOYEE_INACTIVE: "EMPLOYEE_INACTIVE",

  // Emergency
  EMERGENCY_NOT_FOUND: "EMERGENCY_NOT_FOUND",
  EMERGENCY_DUPLICATE: "EMERGENCY_DUPLICATE",
  EMERGENCY_INVALID_STATUS: "EMERGENCY_INVALID_STATUS",
  EMERGENCY_INVALID_ACTION: "EMERGENCY_INVALID_ACTION",
  EMERGENCY_OWN_BOOKING: "EMERGENCY_OWN_BOOKING",

  // Email
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",

  // Calendar
  CALENDAR_GENERATION_FAILED: "CALENDAR_GENERATION_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
