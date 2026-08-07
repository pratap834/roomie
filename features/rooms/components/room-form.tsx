"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AmenitiesInput } from "@/features/rooms/components/amenities-input";
import { roomFormSchema } from "@/features/rooms/validators/room-form.schema";
import {
  EMPTY_ROOM_FORM_VALUES,
  type RoomFormValues,
} from "@/features/rooms/types/room-form-values";
import { ROOM_TYPE_LABELS, ROOM_TYPE_OPTIONS } from "@/features/rooms/utils/room-display";

interface RoomFormProps {
  mode: "create" | "edit";
  defaultValues?: RoomFormValues;
  isSubmitting?: boolean;
  onSubmit: (values: RoomFormValues) => void;
  onCancel?: () => void;
}

export function RoomForm({
  mode,
  defaultValues,
  isSubmitting,
  onSubmit,
  onCancel,
}: RoomFormProps) {
  const router = useRouter();
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema) as never,
    defaultValues: defaultValues ?? EMPTY_ROOM_FORM_VALUES,
  });

  function handleCancel() {
    if (onCancel) return onCancel();
    router.back();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Room name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Skyline Conference Room" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. SKY-401"
                    disabled={mode === "edit"}
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>
                  {mode === "edit"
                    ? "The room code can't be changed after creation."
                    : "Uppercase letters, digits, underscores, or hyphens."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ROOM_TYPE_OPTIONS.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ROOM_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. North Tower" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What makes this room useful to know about?"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Amenities</FormLabel>
                <FormControl>
                  <AmenitiesInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormDescription>Press Enter or comma to add each amenity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create room"
                : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
