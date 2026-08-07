import { type NextRequest } from "next/server";
import { emergencyService } from "@/services/emergency.service";
import { requireEmployee } from "@/lib/auth";
import { ok } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// GET /api/emergency/[id]
// Visible to the requesting employee, the affected booking's owner, or admins.
// ─────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const result = await emergencyService.getRequestById(
      id,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    return ok(result.data);
  } catch (error) {
    return handleApiError(error, "GET /api/emergency/[id]");
  }
}
