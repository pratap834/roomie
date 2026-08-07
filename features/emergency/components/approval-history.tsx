import { CheckCircle2, CircleDot, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMERGENCY_ACTION_LABELS } from "@/features/emergency/utils/emergency-display";
import { formatDateTime } from "@/lib/format";
import type { EmergencyRequestWithRelations } from "@/types";

interface TimelineEntryProps {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
  description?: string;
  isLast?: boolean;
}

function TimelineEntry({ icon, title, timestamp, description, isLast }: TimelineEntryProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
          {icon}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
        {description && <p className="mt-1 text-sm text-foreground">{description}</p>}
      </div>
    </div>
  );
}

export function ApprovalHistory({ request }: { request: EmergencyRequestWithRelations }) {
  const hasDecision = Boolean(request.decidedAt);
  const wasApproved = request.status === "APPROVED" || request.status === "RESOLVED";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Approval history</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div>
          <TimelineEntry
            icon={<CircleDot className="h-3 w-3 text-muted-foreground" />}
            title={`${request.employee.firstName} ${request.employee.lastName} submitted this request`}
            timestamp={formatDateTime(request.createdAt)}
            isLast={!hasDecision}
          />
          {hasDecision && (
            <TimelineEntry
              icon={
                wasApproved ? (
                  <CheckCircle2 className="h-3 w-3 text-success" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive" />
                )
              }
              title={wasApproved ? "Request approved" : "Request rejected"}
              timestamp={formatDateTime(request.decidedAt!)}
              description={
                request.resolutionAction
                  ? EMERGENCY_ACTION_LABELS[request.resolutionAction]
                  : request.resolution ?? undefined
              }
              isLast
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
