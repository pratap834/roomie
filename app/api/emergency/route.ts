import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireEmployee } from "@/lib/auth";
import {
  createEmergencyRequestSchema,
  emergencyFiltersSchema,
} from "@/validators/emergency.validator";
import { created, paginated } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

// ─────────────────────────────────────────────────────────────
// GET /api/emergency
// Returns emergency requests the caller is entitled to see: admins see all,
// employees see only requests raised against bookings they own.
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const employee = await requireEmployee();

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = emergencyFiltersSchema.parse(params);

    const result = await emergencyService.listRequestsForUser(
      employee.id,
      filters,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return paginated(result.data.items, result.data.meta);
  } catch (error) {
    return handleApiError(error, "GET /api/emergency");
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/emergency
// Any authenticated employee may raise an override request against another
// employee's active booking.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const employee = await requireEmployee();

    const { data, error } = await parseJsonBody(
      request,
      createEmergencyRequestSchema,
    );
    if (error) return error;

    const result = await emergencyService.createRequest(data, employee.id);

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return created(result.data, "Emergency request submitted successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/emergency");
  }
}
