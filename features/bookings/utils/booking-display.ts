import type { BookingStatus } from "@/types";
import type { BookingPriority } from "@prisma/client";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const BOOKING_STATUS_BADGE_VARIANT: Record<
  BookingStatus,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  PENDING: "warning",
  CONFIRMED: "default",
  APPROVED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  COMPLETED: "secondary",
};

export const BOOKING_PRIORITY_LABELS: Record<BookingPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const BOOKING_PRIORITY_BADGE_VARIANT: Record<
  BookingPriority,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

/** Statuses that still represent an active, cancellable booking. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = ["CONFIRMED", "APPROVED"];
