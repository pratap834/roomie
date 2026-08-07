import type { EmergencyPriority, EmergencyStatus } from "@/types";

export interface EmergencyListState {
  status: EmergencyStatus | "ALL";
  priority: EmergencyPriority | "ALL";
  page: number;
  pageSize: number;
}

export const DEFAULT_EMERGENCY_LIST_STATE: EmergencyListState = {
  status: "ALL",
  priority: "ALL",
  page: 1,
  pageSize: 10,
};
