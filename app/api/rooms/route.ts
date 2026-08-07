import { type NextRequest } from "next/server";
import { roomService } from "@/services/room.service";
import { requireAdmin } from "@/lib/auth";
import { createRoomSchema, roomFiltersSchema } from "@/validators/room.validator";
import {
  ok,
  created,
  paginated,
  buildPaginationMeta,
} from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/rooms
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = roomFiltersSchema.parse(params);

    const result = await roomService.listRooms(filters);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/rooms");
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/rooms
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { data, error } = await parseJsonBody(request, createRoomSchema);
    if (error) return error;

    const result = await roomService.createRoom(data);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return created(result.data, "Room created successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/rooms");
  }
}
