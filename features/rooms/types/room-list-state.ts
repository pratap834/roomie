import type { RoomStatus, RoomType } from "@/types";

export interface RoomListState {
  search: string;
  status: RoomStatus | "ALL";
  type: RoomType | "ALL";
  page: number;
  pageSize: number;
}

export const DEFAULT_ROOM_LIST_STATE: RoomListState = {
  search: "",
  status: "ALL",
  type: "ALL",
  page: 1,
  pageSize: 10,
};
