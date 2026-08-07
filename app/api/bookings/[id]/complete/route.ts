import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireAdmin } from "@/lib/auth";
import { ok } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/bookings/[id]/complete
// Admin-only. Marks a CONFIRMED booking as COMPLETED.
// ─────────────────────────────────────────────────────────────

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const result = await bookingService.completeBooking(id, admin.id);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Booking marked as completed");
  } catch (error) {
    return handleApiError(error, "PATCH /api/bookings/[id]/complete");
  }
}
