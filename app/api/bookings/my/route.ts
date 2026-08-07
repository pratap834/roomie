import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireEmployee } from "@/lib/auth";
import { bookingFiltersSchema } from "@/validators/booking.validator";
import { paginated } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/bookings/my
// Returns bookings belonging to the currently authenticated employee.
// employeeId is always forced to the caller's own ID, regardless of
// whatever value (if any) is present in the query string.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const employee = await requireEmployee();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { employeeId: _ignored, ...filters } = bookingFiltersSchema.parse(params);

    const result = await bookingService.myBookings(employee.id, filters);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/bookings/my");
  }
}
