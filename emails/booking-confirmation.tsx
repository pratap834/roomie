import * as React from "react";
import {
  BaseLayout,
  DetailList,
  Paragraph,
  type DetailRow,
} from "@/emails/components/base-layout";
import type { BookingEmailDetails, EmailBrand } from "@/emails/types";

export interface BookingConfirmationEmailProps extends EmailBrand {
  recipientName: string;
  booking: BookingEmailDetails;
}

export function bookingDetailRows(booking: BookingEmailDetails): DetailRow[] {
  return [
    { label: "Meeting", value: booking.title },
    { label: "Room", value: `${booking.roomName} (${booking.roomCode})` },
    { label: "Location", value: booking.location },
    { label: "Date", value: booking.date },
    { label: "Time", value: booking.timeRange },
    { label: "Duration", value: booking.duration },
    { label: "Attendees", value: String(booking.attendeeCount) },
    { label: "Organizer", value: booking.organizerName },
  ];
}

export default function BookingConfirmationEmail({
  recipientName,
  booking,
  appName,
  appUrl,
}: BookingConfirmationEmailProps): React.JSX.Element {
  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview={`Your booking for ${booking.roomName} is confirmed`}
      heading="Your booking is confirmed"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        Your room booking has been confirmed. The details are below — a calendar
        invite is attached so you can add it to Google Calendar, Outlook, or
        Apple Calendar.
      </Paragraph>
      <DetailList rows={bookingDetailRows(booking)} />
      <Paragraph>
        If your plans change, please cancel the booking so the room becomes
        available for your colleagues.
      </Paragraph>
    </BaseLayout>
  );
}
