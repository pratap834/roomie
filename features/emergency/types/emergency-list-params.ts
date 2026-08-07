import type { EmergencyPriority, EmergencyStatus } from "@/types";

export interface EmergencyListParams {
  status?: EmergencyStatus;
  priority?: EmergencyPriority;
  employeeId?: string;
  roomId?: string;
  bookingId?: string;
  page?: number;
  pageSize?: number;
}
