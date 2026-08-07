"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";
import type { CreateRoomInput } from "@/validators/room.validator";

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoomInput) => roomService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      toast.success("Room created", {
        description: "The room is now available in the directory.",
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to create room";
      toast.error(message);
    },
  });
}
