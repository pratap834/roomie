import { apiRequest, buildQueryString } from "@/lib/api-client";
import type { Booking, BookingWithRelations, PaginatedResult } from "@/types";
import type { BookingListParams } from "@/features/bookings/types/booking-list-params";
import type { CancelBookingInput, CreateBookingInput } from "@/validators/booking.validator";

/**
 * Client-side service for the Booking resource.
 */
export const bookingService = {
  list(params: BookingListParams = {}): Promise<PaginatedResult<BookingWithRelations>> {
    return apiRequest<PaginatedResult<BookingWithRelations>>(
      `/api/admin/bookings${buildQueryString(params)}`,
    );
  },

  getById(id: string): Promise<BookingWithRelations> {
    return apiRequest<BookingWithRelations>(`/api/bookings/${id}`);
  },

  create(input: CreateBookingInput): Promise<Booking> {
    return apiRequest<Booking>("/api/bookings", {
      method: "POST",
      body: input,
    });
  },

  cancel(id: string, input: CancelBookingInput = {}): Promise<Booking> {
    return apiRequest<Booking>(`/api/bookings/${id}`, {
      method: "DELETE",
      body: input,
    });
  },
};
