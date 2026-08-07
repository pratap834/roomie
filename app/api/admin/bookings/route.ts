import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireAdmin } from "@/lib/auth";
import { bookingFiltersSchema } from "@/validators/booking.validator";
import { paginated } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/bookings
// Admin-only. Lists bookings across all employees with the full filter set.
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
    return handleApiError(error, "GET /api/admin/bookings");
  }
}
