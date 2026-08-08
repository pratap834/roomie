import type { EmergencyPriority, EmergencyStatus } from "@/types";

export interface EmergencyListState {
  scope: "my_requests" | "incoming" | "all";
  status: EmergencyStatus | "ALL";
  priority: EmergencyPriority | "ALL";
  page: number;
  pageSize: number;
}

export const DEFAULT_EMERGENCY_LIST_STATE: EmergencyListState = {
  scope: "my_requests",
  status: "ALL",
  priority: "ALL",
  page: 1,
  pageSize: 10,
};
