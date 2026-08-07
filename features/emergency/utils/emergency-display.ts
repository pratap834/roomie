import type { EmergencyAction, EmergencyPriority, EmergencyStatus } from "@/types";

export const EMERGENCY_STATUS_LABELS: Record<EmergencyStatus, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const EMERGENCY_STATUS_BADGE_VARIANT: Record<
  EmergencyStatus,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  OPEN: "warning",
  IN_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  RESOLVED: "secondary",
  CLOSED: "secondary",
};

export const EMERGENCY_PRIORITY_LABELS: Record<EmergencyPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const EMERGENCY_PRIORITY_BADGE_VARIANT: Record<
  EmergencyPriority,
  "success" | "destructive" | "warning" | "secondary" | "default"
> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  CRITICAL: "destructive",
};

export const EMERGENCY_ACTION_LABELS: Record<EmergencyAction, string> = {
  KEEP_BOOKING: "Kept existing booking",
  ROOM_TRANSFER: "Transferred to another room",
  RESCHEDULE: "Rescheduled",
  REDUCE_DURATION: "Reduced meeting duration",
  CONTACT_EMPLOYEE: "Owner will make contact",
};

export const EMERGENCY_STATUS_OPTIONS: EmergencyStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "APPROVED",
  "REJECTED",
  "RESOLVED",
  "CLOSED",
];

export const EMERGENCY_PRIORITY_OPTIONS: EmergencyPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

/** Requests still awaiting either an admin decision or an owner resolution. */
export const PENDING_EMERGENCY_STATUSES: EmergencyStatus[] = ["OPEN", "IN_REVIEW"];
