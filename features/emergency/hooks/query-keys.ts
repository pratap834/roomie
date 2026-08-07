import type { EmergencyListParams } from "@/features/emergency/types/emergency-list-params";

export const emergencyKeys = {
  all: ["emergency"] as const,
  lists: () => [...emergencyKeys.all, "list"] as const,
  list: (params: EmergencyListParams) => [...emergencyKeys.lists(), params] as const,
  details: () => [...emergencyKeys.all, "detail"] as const,
  detail: (id: string) => [...emergencyKeys.details(), id] as const,
};
