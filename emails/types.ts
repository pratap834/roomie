/**
 * Presentation-only view models for email templates. Services map domain
 * entities into these shapes so templates never import Prisma types or
 * business logic.
 */

export interface EmailBrand {
  appName: string;
  appUrl: string;
}

export interface BookingEmailDetails {
  title: string;
  roomName: string;
  roomCode: string;
  location: string;
  date: string;
  timeRange: string;
  duration: string;
  attendeeCount: number;
  organizerName: string;
}

export interface EmergencyEmailDetails {
  id: string;
  subject: string;
  reason: string;
  priority: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  requestedWindow: string | null;
}
