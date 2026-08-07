import * as React from "react";
import {
  BaseLayout,
  CalloutBox,
  DetailList,
  Paragraph,
} from "@/emails/components/base-layout";
import { bookingDetailRows } from "@/emails/booking-confirmation";
import type { BookingEmailDetails, EmailBrand } from "@/emails/types";

export interface BookingRescheduledEmailProps extends EmailBrand {
  recipientName: string;
  booking: BookingEmailDetails;
  previous: { date: string; timeRange: string; roomName: string };
  reason: string | null;
}

export default function BookingRescheduledEmail({
  recipientName,
  booking,
  previous,
  reason,
  appName,
  appUrl,
}: BookingRescheduledEmailProps): React.JSX.Element {
  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview={`Your booking for ${booking.title} has been updated`}
      heading="Your booking has been updated"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        Your booking has been rescheduled. An updated calendar invite is
        attached — accepting it will replace the previous entry in your calendar.
      </Paragraph>
      <DetailList
        rows={[
          {
            label: "Previously",
            value: `${previous.roomName} · ${previous.date} · ${previous.timeRange}`,
          },
        ]}
      />
      <Paragraph>Updated booking details:</Paragraph>
      <DetailList rows={bookingDetailRows(booking)} />
      {reason ? <CalloutBox>Reason: {reason}</CalloutBox> : null}
    </BaseLayout>
  );
}
