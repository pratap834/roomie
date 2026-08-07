import { Badge } from "@/components/ui/badge";
import type { EmergencyPriority, EmergencyStatus } from "@/types";
import {
  EMERGENCY_PRIORITY_BADGE_VARIANT,
  EMERGENCY_PRIORITY_LABELS,
  EMERGENCY_STATUS_BADGE_VARIANT,
  EMERGENCY_STATUS_LABELS,
} from "@/features/emergency/utils/emergency-display";

export function EmergencyStatusBadge({ status }: { status: EmergencyStatus }) {
  return (
    <Badge variant={EMERGENCY_STATUS_BADGE_VARIANT[status]}>
      {EMERGENCY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function EmergencyPriorityBadge({ priority }: { priority: EmergencyPriority }) {
  return (
    <Badge variant={EMERGENCY_PRIORITY_BADGE_VARIANT[priority]}>
      {EMERGENCY_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
