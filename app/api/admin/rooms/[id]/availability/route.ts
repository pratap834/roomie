import { type NextRequest } from "next/server";
import { roomService } from "@/services/room.service";
import { requireAdmin } from "@/lib/auth";
import { updateRoomAvailabilitySchema } from "@/validators/room.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/rooms/[id]/availability
// Admin-only. Sets a room's overall availability status.
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
    return handleApiError(error, "PATCH /api/admin/rooms/[id]/availability");
  }
}
