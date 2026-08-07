"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { emergencyService } from "@/features/emergency/services/emergency.service";
import { emergencyKeys } from "@/features/emergency/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { AdminEmergencyDecisionInput } from "@/validators/emergency.validator";

export function useDecideEmergency(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminEmergencyDecisionInput) => emergencyService.decide(id, input),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emergencyKeys.detail(id) });
      toast.success(
        input.decision === "APPROVE" ? "Request approved" : "Request rejected",
      );
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to record decision";
      toast.error(message);
    },
  });
}
