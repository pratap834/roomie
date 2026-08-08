import { apiRequest, buildQueryString } from "@/lib/api-client";
import type {
  EmergencyContactDetails,
  EmergencyRequest,
  EmergencyRequestWithRelations,
  PaginatedResult,
} from "@/types";
import type { EmergencyListParams } from "@/features/emergency/types/emergency-list-params";
import type {
  AdminEmergencyDecisionInput,
  CreateEmergencyRequestInput,
  ResolveEmergencyRequestInput,
} from "@/validators/emergency.validator";

export interface ResolveEmergencyResult {
  emergencyRequest: EmergencyRequest;
  contact: EmergencyContactDetails | null;
}

/**
 * Client-side service for the Emergency Request resource. Mirrors the
 * backend's two independent adjudication paths: an admin gatekeeping
 * decision (`decide`) and a booking-accommodation resolution (`resolve`),
 * either of which closes a pending request.
 */
export const emergencyService = {
  list(params: EmergencyListParams = {}): Promise<PaginatedResult<EmergencyRequestWithRelations>> {
    return apiRequest<PaginatedResult<EmergencyRequestWithRelations>>(
      `/api/emergency${buildQueryString(params)}`,
    );
  },

  getById(id: string): Promise<EmergencyRequestWithRelations> {
    return apiRequest<EmergencyRequestWithRelations>(`/api/emergency/${id}`);
  },

  create(input: CreateEmergencyRequestInput): Promise<EmergencyRequest> {
    return apiRequest<EmergencyRequest>("/api/emergency", {
      method: "POST",
      body: input,
    });
  },

  decide(id: string, input: AdminEmergencyDecisionInput): Promise<EmergencyRequest> {
    return apiRequest<EmergencyRequest>(`/api/emergency/${id}/decision`, {
      method: "POST",
      body: input,
    });
  },

  resolve(id: string, input: ResolveEmergencyRequestInput): Promise<ResolveEmergencyResult> {
    return apiRequest<ResolveEmergencyResult>(`/api/emergency/${id}/resolve`, {
      method: "POST",
      body: input,
    });
  },
};
