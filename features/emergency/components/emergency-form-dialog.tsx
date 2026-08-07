"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateEmergencyRequest } from "@/features/emergency/hooks/use-create-emergency-request";
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import type { CreateEmergencyRequestInput } from "@/validators/emergency.validator";

interface EmergencyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedBookingId?: string;
}

export function EmergencyFormDialog({
  open,
  onOpenChange,
  preselectedBookingId,
}: EmergencyFormDialogProps) {
  const createEmergency = useCreateEmergencyRequest();
  const { data: bookingData } = useBookings({ pageSize: 100, page: 1 });
  const activeBookings = (bookingData?.items ?? []).filter(
    (b) => b.status === "CONFIRMED" || b.status === "APPROVED",
  );

  const form = useForm<{
    bookingId: string;
    subject: string;
    reason: string;
    department: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>({
    defaultValues: {
      bookingId: preselectedBookingId ?? "",
      subject: "",
      reason: "",
      department: "",
      priority: "HIGH",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        bookingId: preselectedBookingId ?? "",
        subject: "",
        reason: "",
        department: "",
        priority: "HIGH",
      });
    }
  }, [open, preselectedBookingId]);

  const onSubmit = form.handleSubmit((values) => {
    const payload: CreateEmergencyRequestInput = {
      bookingId: values.bookingId,
      subject: values.subject,
      reason: values.reason,
      department: values.department || undefined,
      priority: values.priority,
    };

    createEmergency.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Raise Emergency Override Request
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Booking Selector */}
            <FormField
              control={form.control}
              name="bookingId"
              rules={{ required: "Please select a booking to request an override for" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Booking</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!preselectedBookingId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking to override…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title} — {b.room.name} ({b.employee.firstName} {b.employee.lastName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              rules={{
                required: "Subject is required",
                minLength: { value: 5, message: "Subject must be at least 5 characters" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject / Short Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Executive Board Emergency Session" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority & Department */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Operations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              rules={{
                required: "Reason is required",
                minLength: { value: 10, message: "Reason must be at least 10 characters" },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Emergency Request</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this emergency override is necessary…"
                      rows={3}
                      {...field}
                    />
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
                disabled={createEmergency.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={createEmergency.isPending}
              >
                {createEmergency.isPending ? "Submitting…" : "Submit Emergency Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
