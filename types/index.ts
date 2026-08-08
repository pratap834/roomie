import type {
  Employee,
  Room,
  Booking,
  EmergencyRequest,
  EmailLog,
  BookingHistory,
  EmployeeRole,
  EmployeeStatus,
  RoomStatus,
  RoomType,
  BookingStatus,
  EmergencyPriority,
  EmergencyStatus,
  EmergencyAction,
  EmailType,
  EmailStatus,
  BookingHistoryAction,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Re-exports from Prisma
// ─────────────────────────────────────────────────────────────

export type {
  Employee,
  Room,
  Booking,
  EmergencyRequest,
  EmailLog,
  BookingHistory,
  EmployeeRole,
  EmployeeStatus,
  RoomStatus,
  RoomType,
  BookingStatus,
  EmergencyPriority,
  EmergencyStatus,
  EmergencyAction,
  EmailType,
  EmailStatus,
  BookingHistoryAction,
};

// ─────────────────────────────────────────────────────────────
// API Response types
// ─────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// Room types
// ─────────────────────────────────────────────────────────────

export type RoomWithStats = Room & {
  _count: {
    bookings: number;
  };
};

export interface RoomFilters {
  status?: RoomStatus;
  type?: RoomType;
  minCapacity?: number;
  maxCapacity?: number;
  floor?: number;
  building?: string;
  isActive?: boolean;
  search?: string;
}

// ─────────────────────────────────────────────────────────────
// Booking types
// ─────────────────────────────────────────────────────────────

export type BookingWithRelations = Booking & {
  employee: Pick<Employee, "id" | "firstName" | "lastName" | "email" | "department">;
  room: Pick<Room, "id" | "name" | "code" | "floor" | "building" | "capacity">;
};

export interface BookingFilters {
  status?: BookingStatus;
  employeeId?: string;
  roomId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ─────────────────────────────────────────────────────────────
// Emergency request types
// ─────────────────────────────────────────────────────────────

export type EmployeeSummary = Pick<
  Employee,
  "id" | "firstName" | "lastName" | "email" | "department" | "clerkId"
>;

export type RoomSummary = Pick<
  Room,
  "id" | "name" | "code" | "floor" | "building" | "capacity"
>;

export type EmergencyRequestWithRelations = EmergencyRequest & {
  employee: EmployeeSummary;
  room: RoomSummary | null;
  transferRoom: RoomSummary | null;
  booking:
    | (Pick<
        Booking,
        "id" | "title" | "date" | "startTime" | "endTime" | "status" | "employeeId" | "roomId"
      > & {
        employee: EmployeeSummary;
        room: RoomSummary;
      })
    | null;
};

export interface EmergencyFilters {
  status?: EmergencyStatus;
  priority?: EmergencyPriority;
  employeeId?: string;
  roomId?: string;
  bookingId?: string;
}

/** Contact details surfaced to a booking owner who chooses CONTACT_EMPLOYEE. */
export interface EmergencyContactDetails {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterDepartment: string | null;
}

// ─────────────────────────────────────────────────────────────
// Employee types
// ─────────────────────────────────────────────────────────────

export type EmployeePublic = Omit<Employee, "deletedAt">;

export interface EmployeeSyncPayload {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// Service result types
// ─────────────────────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };
