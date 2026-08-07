import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireAdmin, requireEmployee } from "@/lib/auth";
import { createBookingSchema, bookingFiltersSchema } from "@/validators/booking.validator";
import { created, paginated } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/bookings
// Admin-only: lists bookings across all employees. Employees looking for
// their own bookings should use GET /api/bookings/my instead.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = bookingFiltersSchema.parse(params);

    const result = await bookingService.listBookings(filters);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/bookings");
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/bookings
// Any authenticated employee may create a booking for themselves.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const employee = await requireEmployee();

    const { data, error } = await parseJsonBody(request, createBookingSchema);
    if (error) return error;

    const result = await bookingService.createBooking(data, employee.id);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return created(result.data, "Booking created successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/bookings");
  }
}
