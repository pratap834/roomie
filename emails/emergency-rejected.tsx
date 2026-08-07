import * as React from "react";
import {
  BaseLayout,
  CalloutBox,
  DetailList,
  Paragraph,
} from "@/emails/components/base-layout";
import { emergencyDetailRows } from "@/emails/emergency-request";
import type { EmailBrand, EmergencyEmailDetails } from "@/emails/types";

export interface EmergencyRejectedEmailProps extends EmailBrand {
  recipientName: string;
  emergency: EmergencyEmailDetails;
  /** Reason the booking owner or an admin declined the request. */
  reason: string | null;
  /** Contact details supplied when the owner opts to be contacted directly. */
  contact: { name: string; email: string } | null;
}

export default function EmergencyRejectedEmail({
  recipientName,
  emergency,
  reason,
  contact,
  appName,
  appUrl,
}: EmergencyRejectedEmailProps): React.JSX.Element {
  return (
    <BaseLayout
      appName={appName}
      appUrl={appUrl}
      preview="Your emergency request was not approved"
      heading="Your emergency request was declined"
    >
      <Paragraph>Hi {recipientName},</Paragraph>
      <Paragraph>
        The existing booking will go ahead as scheduled, so your emergency
        override request could not be accommodated.
      </Paragraph>
      <DetailList rows={emergencyDetailRows(emergency)} />
      {reason ? <CalloutBox>Reason: {reason}</CalloutBox> : null}
      {contact ? (
        <Paragraph>
          The booking owner is happy to discuss alternatives — you can reach{" "}
          {contact.name} at {contact.email}.
        </Paragraph>
      ) : null}
      <Paragraph>
        You can search for another available room in the booking dashboard.
      </Paragraph>
    </BaseLayout>
  );
}
