import { NextResponse, type NextRequest } from "next/server";
import { bookingService } from "@/services/booking.service";
import { calendarService } from "@/services/calendar.service";
import { requireEmployee } from "@/lib/auth";
import { handleApiError } from "@/utils/error-handler";
import { formatLocationLabel } from "@/utils/calendar";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────
// GET /api/bookings/[id]/calendar
// Owner or admin. Returns a downloadable .ics file compatible with Google
// Calendar, Outlook, and Apple Calendar. No external calendar API is used.
// ─────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const employee = await requireEmployee();

    const { id } = await params;
    const result = await bookingService.getBookingById(
      id,
      employee.id,
      employee.role === "ADMIN",
    );

    if (!result.ok) {
      return handleApiError(new Error(result.code));
    }

    const booking = result.data;
    const cancelled = booking.status === "CANCELLED";

    const event = {
      uid: booking.id,
      title: booking.title,
      description: booking.description ?? undefined,
      location: formatLocationLabel(booking.room),
      start: booking.startTime,
      end: booking.endTime,
      organizer: {
        name: `${booking.employee.firstName} ${booking.employee.lastName}`,
        email: booking.employee.email,
      },
    };

    const ics = cancelled
      ? calendarService.buildCancellation(event)
      : calendarService.buildEvent(event);

    if (!ics.ok) {
      return handleApiError(new Error(ics.code));
    }

    return new NextResponse(ics.data.content, {
      status: 200,
      headers: {
        "Content-Type": ics.data.contentType,
        "Content-Disposition": `attachment; filename="${ics.data.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/bookings/[id]/calendar");
  }
}
