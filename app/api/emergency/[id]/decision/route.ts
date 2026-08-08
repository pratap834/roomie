import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireEmployee } from "@/lib/auth";
import { adminEmergencyDecisionSchema } from "@/validators/emergency.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// POST /api/emergency/[id]/decision
// Booking owner (or Admin) decision on a pending emergency request.
// Allows the booking owner to Approve or Reject the emergency request.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const { data, error } = await parseJsonBody(
      request,
      adminEmergencyDecisionSchema,
    );
    if (error) return error;

    const result = await emergencyService.decideRequest(
      id,
      data,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(
      result.data,
      data.decision === "APPROVE"
        ? "Emergency request approved"
        : "Emergency request rejected",
    );
  } catch (error) {
    return handleApiError(error, "POST /api/emergency/[id]/decision");
  }
}
