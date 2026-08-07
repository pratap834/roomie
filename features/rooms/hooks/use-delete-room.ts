"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";
import { ApiClientError } from "@/lib/api-client";

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roomService.delete(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      queryClient.removeQueries({ queryKey: roomKeys.detail(id) });
      toast.success("Room deleted");
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Failed to delete room";
      toast.error(message);
    },
  });
}
