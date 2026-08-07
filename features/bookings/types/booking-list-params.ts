import type { BookingStatus } from "@/types";

export interface BookingListParams {
  status?: BookingStatus;
  roomId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
