import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types";
import type { BookingPriority } from "@prisma/client";
import {
  BOOKING_PRIORITY_BADGE_VARIANT,
  BOOKING_PRIORITY_LABELS,
  BOOKING_STATUS_BADGE_VARIANT,
  BOOKING_STATUS_LABELS,
} from "@/features/bookings/utils/booking-display";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>
  );
}

export function BookingPriorityBadge({ priority }: { priority: BookingPriority }) {
  return (
    <Badge variant={BOOKING_PRIORITY_BADGE_VARIANT[priority]}>
      {BOOKING_PRIORITY_LABELS[priority]}
    </Badge>
  );
}
