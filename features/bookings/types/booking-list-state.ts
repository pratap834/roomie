import type { BookingStatus } from "@/types";

export interface BookingListState {
  status: BookingStatus | "ALL";
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_BOOKING_LIST_STATE: BookingListState = {
  status: "ALL",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 10,
};
