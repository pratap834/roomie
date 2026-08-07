"use client";

import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoomForm } from "@/features/rooms/components/room-form";
import { useRoom } from "@/features/rooms/hooks/use-room";
import { useUpdateRoom } from "@/features/rooms/hooks/use-update-room";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";
import { roomToFormValues, type RoomFormValues } from "@/features/rooms/types/room-form-values";

export default function EditRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: room, isLoading, isError, refetch } = useRoom(params.id);
  const updateRoom = useUpdateRoom(params.id);

  usePageBreadcrumbs([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rooms", href: "/rooms" },
    { label: room?.name ?? "Room", href: room ? `/rooms/${room.id}` : undefined },
    { label: "Edit" },
  ]);

  function handleSubmit(values: RoomFormValues) {
    const { code: _code, ...updatePayload } = values;
    updateRoom.mutate(updatePayload, {
      onSuccess: (updated) => router.push(`/rooms/${updated.id}`),
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Edit room" description="Update this room's details." />
      <Card>
        <CardContent className="p-5">
          {isError ? (
            <ErrorState
              title="Couldn't load this room"
              description="Something went wrong while fetching this room."
              onRetry={() => refetch()}
            />
          ) : isLoading || !room ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <RoomForm
              mode="edit"
              defaultValues={roomToFormValues(room)}
              isSubmitting={updateRoom.isPending}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/rooms/${room.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
