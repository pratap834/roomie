"use client";

import { useQuery } from "@tanstack/react-query";

import { emergencyService } from "@/features/emergency/services/emergency.service";
import { emergencyKeys } from "@/features/emergency/hooks/query-keys";

export function useEmergencyRequest(id: string | undefined) {
  return useQuery({
    queryKey: emergencyKeys.detail(id ?? ""),
    queryFn: () => emergencyService.getById(id as string),
    enabled: Boolean(id),
  });
}
