"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { UpdateRoomInput } from "@/validators/room.validator";

export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRoomInput) => roomService.update(id, input),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.setQueryData(roomKeys.detail(id), room);
      toast.success("Room updated", {
        description: `${room.name} has been saved.`,
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to update room";
      toast.error(message);
    },
  });
}
