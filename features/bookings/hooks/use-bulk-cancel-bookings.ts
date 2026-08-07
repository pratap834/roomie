"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bookingService } from "@/features/bookings/services/booking.service";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";

export function useBulkCancelBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => bookingService.cancel(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      return { succeeded: ids.length - failed, failed, total: ids.length };
    },
    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      if (failed === 0) {
        toast.success(`${succeeded} booking${succeeded === 1 ? "" : "s"} cancelled`);
      } else {
        toast.warning(`${succeeded} of ${total} bookings cancelled`, {
          description: `${failed} could not be cancelled.`,
        });
      }
    },
    onError: () => toast.error("Failed to cancel the selected bookings"),
  });
}
