import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireAdmin } from "@/lib/auth";
import { emergencyFiltersSchema } from "@/validators/emergency.validator";
import { paginated } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/emergency
// Admin-only. Lists every emergency override request.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = emergencyFiltersSchema.parse(params);

    const result = await emergencyService.listRequests(filters);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/admin/emergency");
  }
}
