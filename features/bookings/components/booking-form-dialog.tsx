"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateBooking } from "@/features/bookings/hooks/use-create-booking";
import { useRooms } from "@/features/rooms/hooks/use-rooms";
import { createBookingSchema, type CreateBookingInput } from "@/validators/booking.validator";
import { ROOM_TYPE_LABELS } from "@/features/rooms/utils/room-display";

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill the roomId if opened from the room detail page */
  preselectedRoomId?: string;
}

export function BookingFormDialog({
  open,
  onOpenChange,
  preselectedRoomId,
}: BookingFormDialogProps) {
  const createBooking = useCreateBooking();
  const { data: roomData } = useRooms({ pageSize: 100, page: 1 });
  const availableRooms = (roomData?.items ?? []).filter((r) => r.status === "AVAILABLE");

  const now = new Date();
  // Default start: next rounded 30 min slot at least 15 min from now
  const defaultStart = new Date(now.getTime() + 20 * 60_000);
  defaultStart.setSeconds(0, 0);
  if (defaultStart.getMinutes() % 30 !== 0) {
    defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 30) * 30, 0, 0);
  }
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60_000);

  const toDateTimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const form = useForm<{
    title: string;
    roomId: string;
    date: string;
    startTimeLocal: string;
    endTimeLocal: string;
    attendeeCount: number;
    notes: string;
  }>({
    defaultValues: {
      title: "",
      roomId: preselectedRoomId ?? "",
      date: defaultStart.toISOString().split("T")[0],
      startTimeLocal: toDateTimeLocal(defaultStart),
      endTimeLocal: toDateTimeLocal(defaultEnd),
      attendeeCount: 1,
      notes: "",
    },
  });

  // Reset when dialog opens
  React.useEffect(() => {
    if (open) {
      const freshStart = new Date();
      freshStart.setMinutes(Math.ceil(freshStart.getMinutes() / 30) * 30 + 30, 0, 0);
      const freshEnd = new Date(freshStart.getTime() + 60 * 60_000);
      form.reset({
        title: "",
        roomId: preselectedRoomId ?? "",
        date: freshStart.toISOString().split("T")[0],
        startTimeLocal: toDateTimeLocal(freshStart),
        endTimeLocal: toDateTimeLocal(freshEnd),
        attendeeCount: 1,
        notes: "",
      });
    }
  }, [open, preselectedRoomId]);

  const onSubmit = form.handleSubmit((values) => {
    // Convert local datetime strings to ISO strings (they come as "YYYY-MM-DDTHH:mm")
    const startDate = new Date(values.startTimeLocal);
    const endDate = new Date(values.endTimeLocal);
    const dateStr = startDate.toISOString().split("T")[0];

    const payload: CreateBookingInput = {
      title: values.title,
      roomId: values.roomId,
      date: dateStr,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      attendeeCount: values.attendeeCount,
      priority: "MEDIUM",
      notes: values.notes || undefined,
    };

    createBooking.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Book a Room
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Meeting Title */}
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Meeting title is required", minLength: { value: 2, message: "Title must be at least 2 characters" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sprint Planning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room */}
            <FormField
              control={form.control}
              name="roomId"
              rules={{ required: "Please select a room" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!preselectedRoomId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({ROOM_TYPE_LABELS[room.type]}, cap. {room.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start & End time */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTimeLocal"
                rules={{ required: "Start time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTimeLocal"
                rules={{ required: "End time is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Attendees */}
            <FormField
              control={form.control}
              name="attendeeCount"
              rules={{
                required: "Number of attendees is required",
                min: { value: 1, message: "At least 1 attendee is required" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of attendees</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createBooking.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBooking.isPending}>
                {createBooking.isPending ? "Booking…" : "Book room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
