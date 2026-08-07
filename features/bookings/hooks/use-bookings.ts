"use client";

import { useQuery } from "@tanstack/react-query";

import { bookingService } from "@/features/bookings/services/booking.service";
import { bookingKeys } from "@/features/bookings/hooks/query-keys";
import type { BookingListParams } from "@/features/bookings/types/booking-list-params";

export function useBookings(params: BookingListParams = {}) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingService.list(params),
    placeholderData: (previousData) => previousData,
  });
}
