import { type NextRequest } from "next/server";
import { roomService } from "@/services/room.service";
import { bookingService } from "@/services/booking.service";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { updateRoomAvailabilitySchema } from "@/validators/room.validator";
import { availabilityQuerySchema } from "@/validators/booking.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// GET /api/rooms/[id]/availability?date=&startTime=&endTime=
// Any authenticated employee. Checks whether a room is free for a given
// time window. Only occupancy/timing is returned — never the meeting
// title or the booking employee's identity.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { date, startTime, endTime } = availabilityQuerySchema.parse(query);

    const result = await bookingService.checkAvailability(id, date, startTime, endTime);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data);
  } catch (error) {
    return handleApiError(error, "GET /api/rooms/[id]/availability");
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/rooms/[id]/availability
// Admin-only. Marks the room's overall status (e.g. MAINTENANCE).
// ─────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { data, error } = await parseJsonBody(
      request,
      updateRoomAvailabilitySchema,
    );
    if (error) return error;

    const result = await roomService.updateAvailability(id, data);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Room availability updated successfully");
  } catch (error) {
    return handleApiError(error, "PATCH /api/rooms/[id]/availability");
  }
}
