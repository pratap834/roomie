"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookingService } from "@/features/bookings/services/booking.service";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { CreateBookingInput } from "@/validators/booking.validator";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success("Room booked successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to create booking";
      toast.error(message);
    },
  });
}
