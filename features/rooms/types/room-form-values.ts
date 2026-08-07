import type { RoomType } from "@/types";

export interface RoomFormValues {
  name: string;
  code: string;
  description?: string;
  floor: number;
  building?: string;
  capacity: number;
  type: RoomType;
  amenities: string[];
  imageUrl?: string;
}

export function roomToFormValues(room: {
  name: string;
  code: string;
  description: string | null;
  floor: number;
  building: string | null;
  capacity: number;
  type: RoomType;
  amenities: string[];
  imageUrl: string | null;
}): RoomFormValues {
  return {
    name: room.name,
    code: room.code,
    description: room.description ?? "",
    floor: room.floor,
    building: room.building ?? "",
    capacity: room.capacity,
    type: room.type,
    amenities: room.amenities,
    imageUrl: room.imageUrl ?? "",
  };
}

export const EMPTY_ROOM_FORM_VALUES: RoomFormValues = {
  name: "",
  code: "",
  description: "",
  floor: 1,
  building: "",
  capacity: 4,
  type: "CONFERENCE",
  amenities: [],
  imageUrl: "",
};
