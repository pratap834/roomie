"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { UpdateRoomAvailabilityInput } from "@/validators/room.validator";

export function useUpdateRoomAvailability(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRoomAvailabilityInput) =>
      roomService.updateAvailability(id, input),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.setQueryData(roomKeys.detail(id), room);
      toast.success("Availability updated", {
        description: `${room.name} is now marked ${room.status.toLowerCase()}.`,
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to update availability";
      toast.error(message);
    },
  });
}
