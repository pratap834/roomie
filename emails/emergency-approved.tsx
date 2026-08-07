import * as React from "react";
import {
  BaseLayout,
  CalloutBox,
  DetailList,
  Paragraph,
} from "@/emails/components/base-layout";
import { bookingDetailRows } from "@/emails/booking-confirmation";
import { emergencyDetailRows } from "@/emails/emergency-request";
import type {
  BookingEmailDetails,
  EmailBrand,
  EmergencyEmailDetails,
} from "@/emails/types";

export interface EmergencyApprovedEmailProps extends EmailBrand {
  recipientName: string;
  emergency: EmergencyEmailDetails;
  /** Human-readable description of the accommodation, e.g. "Room transfer". */
  outcome: string;
  /** Post-decision state of the affected booking. */
  booking: BookingEmailDetails;
  note: string | null;
}

export default function EmergencyApprovedEmail({
  recipientName,
  emergency,
  outcome,
  booking,
  note,
  appName,
  appUrl,
}: EmergencyApprovedEmailProps): React.JSX.Element {
  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview={`Your emergency request was approved: ${outcome}`}
      heading="Your emergency request was approved"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        The booking owner has accommodated your emergency request. Outcome:{" "}
        <strong>{outcome}</strong>.
      </Paragraph>
      <DetailList rows={emergencyDetailRows(emergency)} />
      <Paragraph>Current state of the affected booking:</Paragraph>
      <DetailList rows={bookingDetailRows(booking)} />
      {note ? <CalloutBox>Note from the booking owner: {note}</CalloutBox> : null}
      <Paragraph>
        Please confirm your own booking in the dashboard if the room is now
        free — availability is not reserved automatically.
      </Paragraph>
    </BaseLayout>
  );
}
