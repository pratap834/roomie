"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { emergencyService } from "@/features/emergency/services/emergency.service";
import { emergencyKeys } from "@/features/emergency/hooks/query-keys";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { ResolveEmergencyRequestInput } from "@/validators/emergency.validator";

export function useResolveEmergency(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ResolveEmergencyRequestInput) => emergencyService.resolve(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emergencyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success("Request resolved");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to resolve request";
      toast.error(message);
    },
  });
}
