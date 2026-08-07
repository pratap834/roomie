import { Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { EmergencyRequestWithRelations } from "@/types";

export function RequestedChangePanel({
  request,
}: {
  request: EmergencyRequestWithRelations;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Requested change</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="whitespace-pre-wrap text-sm text-foreground">{request.description}</p>

        {request.requestedStartTime && request.requestedEndTime && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              Requested window: {formatDateTime(request.requestedStartTime)} –{" "}
              {formatDateTime(request.requestedEndTime)}
            </span>
          </div>
        )}

        {request.department && (
          <p className="text-xs text-muted-foreground">Department: {request.department}</p>
        )}
      </CardContent>
    </Card>
  );
}
