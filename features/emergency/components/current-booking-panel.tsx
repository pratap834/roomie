import { CalendarClock, MapPin, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/features/bookings/components/booking-status-badge";
import { formatDate, formatTimeRange } from "@/lib/format";
import type { EmergencyRequestWithRelations } from "@/types";

export function CurrentBookingPanel({
  booking,
}: {
  booking: EmergencyRequestWithRelations["booking"];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Current booking</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!booking ? (
          <p className="text-sm text-muted-foreground">
            The referenced booking no longer exists.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{booking.title}</p>
                <p className="text-xs text-muted-foreground">
                  Owned by {booking.employee.firstName} {booking.employee.lastName}
                  {booking.employee.department ? ` · ${booking.employee.department}` : ""}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>

            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {formatDate(booking.date)} · {formatTimeRange(booking.startTime, booking.endTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {booking.room.name} ({booking.room.code})
                  {booking.room.building ? ` · ${booking.room.building}` : ""}, Floor{" "}
                  {booking.room.floor}
                </span>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
