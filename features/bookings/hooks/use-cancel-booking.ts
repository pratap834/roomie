"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookingService } from "@/features/bookings/services/booking.service";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { CancelBookingInput } from "@/validators/booking.validator";

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: CancelBookingInput }) =>
      bookingService.cancel(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      toast.success("Booking cancelled");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to cancel booking";
      toast.error(message);
    },
  });
}
