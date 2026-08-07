import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  EmergencyPriorityBadge,
  EmergencyStatusBadge,
} from "@/features/emergency/components/emergency-status-badge";
import { formatDateTime } from "@/lib/format";
import type { EmergencyRequestWithRelations } from "@/types";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function RequestMetaPanel({ request }: { request: EmergencyRequestWithRelations }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <EmergencyStatusBadge status={request.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Priority</span>
          <EmergencyPriorityBadge priority={request.priority} />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Requested by</span>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">
                {initials(request.employee.firstName, request.employee.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {request.employee.firstName} {request.employee.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{request.employee.email}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Submitted</span>
          <p className="text-foreground">{formatDateTime(request.createdAt)}</p>
        </div>

        {request.department && (
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Department</span>
            <p className="text-foreground">{request.department}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
