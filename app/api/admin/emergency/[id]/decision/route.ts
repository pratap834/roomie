import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireAdmin } from "@/lib/auth";
import { adminEmergencyDecisionSchema } from "@/validators/emergency.validator";
import { ok } from "@/utils/api-response";
import { handleApiError, parseJsonBody } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/emergency/[id]/decision
// Admin-only adjudication of a pending request. This records the decision
// without applying a booking accommodation — to transfer, reschedule, or
// shorten the booking, use POST /api/emergency/[id]/resolve instead.
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const { data, error } = await parseJsonBody(
      request,
      adminEmergencyDecisionSchema,
    );
    if (error) return error;

    const result = await emergencyService.adminDecide(id, data, admin.id);

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
    return handleApiError(error, "POST /api/admin/emergency/[id]/decision");
  }
}
