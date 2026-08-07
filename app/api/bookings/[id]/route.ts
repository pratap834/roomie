import { type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { requireEmployee } from "@/lib/auth";
import { updateBookingSchema, cancelBookingSchema } from "@/validators/booking.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// GET /api/bookings/[id]
// Owner or admin.
// ─────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const result = await bookingService.getBookingById(
      id,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data);
  } catch (error) {
    return handleApiError(error, "GET /api/bookings/[id]");
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/bookings/[id]
// Owner or admin. Only CONFIRMED, still-upcoming bookings may be edited.
// ─────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const { data, error } = await parseJsonBody(request, updateBookingSchema);
    if (error) return error;

    const result = await bookingService.updateBooking(
      id,
      data,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Booking updated successfully");
  } catch (error) {
    return handleApiError(error, "PATCH /api/bookings/[id]");
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/bookings/[id]
// Owner or admin. Bookings are never hard-deleted (BookingHistory carries
// the audit trail), so DELETE performs a cancellation. An optional JSON
// body with a `reason` field is accepted, matching the cancel validator.
// ─────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

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
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Booking cancelled successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/bookings/[id]");
  }
}
