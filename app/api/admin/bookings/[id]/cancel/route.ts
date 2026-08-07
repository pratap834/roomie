import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireAdmin } from "@/lib/auth";
import { cancelBookingSchema } from "@/validators/booking.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/bookings/[id]/cancel
// Admin-only override cancellation. Bookings are never hard-deleted; the
// BookingHistory entry written by the service carries the audit trail.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;

    let reason: string | undefined;
    const contentLength = request.headers.get("content-length");
    if (contentLength && contentLength !== "0") {
      const { data, error } = await parseJsonBody(request, cancelBookingSchema);
      if (error) return error;
      reason = data.reason;
    }

    const result = await bookingService.cancelBooking(
      id,
      { reason },
      admin.id,
      true,
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Booking cancelled successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/admin/bookings/[id]/cancel");
  }
}
