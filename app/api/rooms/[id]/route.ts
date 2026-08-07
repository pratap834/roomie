import { type NextRequest } from "next/server";
import { roomService } from "@/services/room.service";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { updateRoomSchema } from "@/validators/room.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// GET /api/rooms/[id]
// ─────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const result = await roomService.getRoomById(id);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data);
  } catch (error) {
    return handleApiError(error, "GET /api/rooms/[id]");
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/rooms/[id]
// ─────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { data, error } = await parseJsonBody(request, updateRoomSchema);
    if (error) return error;

    const result = await roomService.updateRoom(id, data);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Room updated successfully");
  } catch (error) {
    return handleApiError(error, "PUT /api/rooms/[id]");
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/rooms/[id]
// ─────────────────────────────────────────────────────────────

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { id } = await params;
    const result = await roomService.deleteRoom(id);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Room deleted successfully");
  } catch (error) {
    return handleApiError(error, "DELETE /api/rooms/[id]");
  }
}
