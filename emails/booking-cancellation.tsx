import * as React from "react";
import {
  BaseLayout,
  CalloutBox,
  DetailList,
  Paragraph,
} from "@/emails/components/base-layout";
import { bookingDetailRows } from "@/emails/booking-confirmation";
import type { BookingEmailDetails, EmailBrand } from "@/emails/types";

export interface BookingCancellationEmailProps extends EmailBrand {
  recipientName: string;
  booking: BookingEmailDetails;
  reason: string | null;
  cancelledBy: string;
}

export default function BookingCancellationEmail({
  recipientName,
  booking,
  reason,
  cancelledBy,
  appName,
  appUrl,
}: BookingCancellationEmailProps): React.JSX.Element {
  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview={`Your booking for ${booking.roomName} has been cancelled`}
      heading="Your booking has been cancelled"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        The following booking has been cancelled by {cancelledBy}. The room is
        now free for other employees to reserve.
      </Paragraph>
      <DetailList rows={bookingDetailRows(booking)} />
      {reason ? <CalloutBox>Reason: {reason}</CalloutBox> : null}
      <Paragraph>
        You can book another room at any time from the booking dashboard.
      </Paragraph>
    </BaseLayout>
  );
}
