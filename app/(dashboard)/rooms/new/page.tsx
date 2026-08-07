"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RoomForm } from "@/features/rooms/components/room-form";
import { useCreateRoom } from "@/features/rooms/hooks/use-create-room";
import { usePageBreadcrumbs } from "@/layouts/breadcrumb-context";
import type { RoomFormValues } from "@/features/rooms/types/room-form-values";

export default function NewRoomPage() {
  usePageBreadcrumbs([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rooms", href: "/rooms" },
    { label: "New room" },
  ]);

  const router = useRouter();
  const createRoom = useCreateRoom();

  function handleSubmit(values: RoomFormValues) {
    createRoom.mutate(values, {
      onSuccess: (room) => router.push(`/rooms/${room.id}`),
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="New room" description="Add a meeting room to the directory." />
      <Card>
        <CardContent className="p-5">
          <RoomForm mode="create" isSubmitting={createRoom.isPending} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
