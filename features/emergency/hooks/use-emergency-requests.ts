"use client";

import { useQuery } from "@tanstack/react-query";

import { emergencyService } from "@/features/emergency/services/emergency.service";
import { emergencyKeys } from "@/features/emergency/hooks/query-keys";
import type { EmergencyListParams } from "@/features/emergency/types/emergency-list-params";

export function useEmergencyRequests(params: EmergencyListParams = {}) {
  return useQuery({
    queryKey: emergencyKeys.list(params),
    queryFn: () => emergencyService.list(params),
    placeholderData: (previousData) => previousData,
  });
}
