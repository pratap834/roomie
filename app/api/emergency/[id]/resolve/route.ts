import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireEmployee } from "@/lib/auth";
import { resolveEmergencyRequestSchema } from "@/validators/emergency.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// POST /api/emergency/[id]/resolve
// Booking-owner approval workflow. The owner may keep the booking, approve a
// room transfer, reschedule, reduce the duration, or opt to contact the
// requesting employee. Admins may act on the owner's behalf.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const { data, error } = await parseJsonBody(
      request,
      resolveEmergencyRequestSchema,
    );
    if (error) return error;

    const result = await emergencyService.resolveRequest(
      id,
      data,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data, "Emergency request resolved successfully");
  } catch (error) {
    return handleApiError(error, "POST /api/emergency/[id]/resolve");
  }
}
