import * as React from "react";
import { Link } from "@react-email/components";
import {
  BaseLayout,
  CalloutBox,
  DetailList,
  Paragraph,
  type DetailRow,
} from "@/emails/components/base-layout";
import { bookingDetailRows } from "@/emails/booking-confirmation";
import type {
  BookingEmailDetails,
  EmailBrand,
  EmergencyEmailDetails,
} from "@/emails/types";

export interface EmergencyRequestEmailProps extends EmailBrand {
  recipientName: string;
  booking: BookingEmailDetails;
  emergency: EmergencyEmailDetails;
}

export function emergencyDetailRows(
  emergency: EmergencyEmailDetails,
): DetailRow[] {
  const rows: DetailRow[] = [
    { label: "Subject", value: emergency.subject },
    { label: "Priority", value: emergency.priority },
    { label: "Requested by", value: emergency.requesterName },
    { label: "Department", value: emergency.requesterDepartment },
    { label: "Contact", value: emergency.requesterEmail },
  ];

  if (emergency.requestedWindow) {
    rows.push({ label: "Requested time", value: emergency.requestedWindow });
  }

  return rows;
}

export default function EmergencyRequestEmail({
  recipientName,
  booking,
  emergency,
  appName,
  appUrl,
}: EmergencyRequestEmailProps): React.JSX.Element {
  const actionUrl = `${appUrl}/emergency/${emergency.id}`;

  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview={`Emergency room request for ${booking.roomName}`}
      heading="A colleague needs your room"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        An emergency override request has been raised against one of your
        bookings. You remain in control — nothing has changed yet.
      </Paragraph>
      <DetailList rows={emergencyDetailRows(emergency)} />
      <CalloutBox>{emergency.reason}</CalloutBox>
      <Paragraph>Your booking:</Paragraph>
      <DetailList rows={bookingDetailRows(booking)} />
      <Paragraph>
        Click below to open the request in your dashboard to approve a transfer/reschedule or keep your room:
      </Paragraph>
      <div style={{ textAlign: "center", margin: "24px 0" }}>
        <Link
          href={actionUrl}
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            padding: "12px 24px",
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Review & Respond to Request
        </Link>
      </div>
    </BaseLayout>
  );
}
