import type { EmergencyPriority, EmergencyStatus } from "@/types";

export interface EmergencyListParams {
  status?: EmergencyStatus;
  priority?: EmergencyPriority;
  employeeId?: string;
  roomId?: string;
  bookingId?: string;
  scope?: "my_requests" | "incoming" | "all";
  page?: number;
  pageSize?: number;
}
