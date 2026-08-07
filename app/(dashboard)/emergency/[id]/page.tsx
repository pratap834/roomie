"use client";

import { useParams } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmergencyRequest } from "@/features/emergency/hooks/use-emergency-request";
import { CurrentBookingPanel } from "@/features/emergency/components/current-booking-panel";
import { RequestedChangePanel } from "@/features/emergency/components/requested-change-panel";
import { ApprovalHistory } from "@/features/emergency/components/approval-history";
import { AvailableActionsPanel } from "@/features/emergency/components/available-actions-panel";
import { RequestMetaPanel } from "@/features/emergency/components/request-meta-panel";
import { PENDING_EMERGENCY_STATUSES } from "@/features/emergency/utils/emergency-display";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";

function ReviewPageSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function EmergencyRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: request, isLoading, isError, refetch } = useEmergencyRequest(params.id);

  usePageBreadcrumbs([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Emergency requests", href: "/emergency" },
    { label: request?.subject ?? "Request" },
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={request?.subject ?? "Emergency request"}
        description={
          request
            ? `Submitted by ${request.employee.firstName} ${request.employee.lastName}`
            : undefined
        }
      />

      {isError ? (
        <ErrorState
          title="Couldn't load this request"
          description="The request may have been removed, or something went wrong."
          onRetry={() => refetch()}
        />
      ) : isLoading || !request ? (
        <ReviewPageSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <RequestedChangePanel request={request} />
            <CurrentBookingPanel booking={request.booking} />
            {PENDING_EMERGENCY_STATUSES.includes(request.status) && (
              <AvailableActionsPanel requestId={request.id} />
            )}
            <ApprovalHistory request={request} />
          </div>
          <div>
            <RequestMetaPanel request={request} />
          </div>
        </div>
      )}
    </div>
  );
}
