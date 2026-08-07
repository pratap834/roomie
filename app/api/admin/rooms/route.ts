import { type NextRequest } from "next/server";
import { roomService } from "@/services/room.service";
import { requireAdmin } from "@/lib/auth";
import { roomFiltersSchema } from "@/validators/room.validator";
import { paginated } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/rooms
// Admin-only room listing. Unlike the public GET /api/rooms, this accepts the
// full filter set including inactive and unavailable rooms.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = roomFiltersSchema.parse(params);

    const result = await roomService.listRooms(filters);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/rooms");
  }
}
