"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roomService } from "@/features/rooms/services/room.service";
import { roomKeys } from "@/features/rooms/hooks/query-keys";

/**
 * Deletes multiple rooms. There is no bulk-delete endpoint on the backend,
 * so this issues one DELETE per room and reports how many succeeded —
 * consistent with the single-room delete flow, just fanned out.
 */
export function useBulkDeleteRooms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => roomService.delete(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      return { succeeded: ids.length - failed, failed, total: ids.length };
    },
    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
      if (failed === 0) {
        toast.success(`${succeeded} room${succeeded === 1 ? "" : "s"} deleted`);
      } else {
        toast.warning(`${succeeded} of ${total} rooms deleted`, {
          description: `${failed} could not be deleted.`,
        });
      }
    },
    onError: () => {
      toast.error("Failed to delete the selected rooms");
    },
  });
}
