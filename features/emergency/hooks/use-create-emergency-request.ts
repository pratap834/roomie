"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { emergencyService } from "@/features/emergency/services/emergency.service";
import { emergencyKeys } from "@/features/emergency/hooks/query-keys";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { CreateEmergencyRequestInput } from "@/validators/emergency.validator";

export function useCreateEmergencyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmergencyRequestInput) => emergencyService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success("Emergency request submitted! Notification email sent to room owner.");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Failed to submit emergency request";
      toast.error(message);
    },
  });
}
