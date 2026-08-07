"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CalendarPlus, Pencil, Trash2 } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomDetailCard } from "@/features/rooms/components/room-detail-card";
import { BookingFormDialog } from "@/features/bookings/components/booking-form-dialog";
import { EmergencyFormDialog } from "@/features/emergency/components/emergency-form-dialog";
import { useRoom } from "@/features/rooms/hooks/use-room";
import { useDeleteRoom } from "@/features/rooms/hooks/use-delete-room";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";

function RoomDetailSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: room, isLoading, isError, refetch } = useRoom(params.id);
  const deleteRoom = useDeleteRoom();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [bookOpen, setBookOpen] = React.useState(false);
  const [emergencyOpen, setEmergencyOpen] = React.useState(false);

  usePageBreadcrumbs([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rooms", href: "/rooms" },
    { label: room?.name ?? "Room" },
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title={room?.name ?? "Room details"}
        description={room ? `${room.code}` : undefined}
        actions={
          room && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setBookOpen(true)} disabled={room.status !== "AVAILABLE"}>
                <CalendarPlus className="h-4 w-4" />
                Book room
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEmergencyOpen(true)}
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Emergency Request
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/rooms/${room.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )
        }
      />

      {isError ? (
        <ErrorState
          title="Couldn't load this room"
          description="The room may have been removed, or something went wrong."
          onRetry={() => refetch()}
        />
      ) : isLoading || !room ? (
        <RoomDetailSkeleton />
      ) : (
        <RoomDetailCard room={room} />
      )}

      {room && (
        <>
          <ConfirmActionDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete room"
            description={`This will permanently remove "${room.name}" (${room.code}) from the directory.`}
            isPending={deleteRoom.isPending}
            onConfirm={() =>
              deleteRoom.mutate(room.id, {
                onSuccess: () => router.push("/rooms"),
              })
            }
          />
          <BookingFormDialog
            open={bookOpen}
            onOpenChange={setBookOpen}
            preselectedRoomId={room.id}
          />
          <EmergencyFormDialog
            open={emergencyOpen}
            onOpenChange={setEmergencyOpen}
          />
        </>
      )}
    </div>
  );
}
