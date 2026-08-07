import { prisma } from "@/lib/prisma";
import type {
  Booking,
  BookingHistoryAction,
  BookingPriority,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import type { BookingWithRelations } from "@/types";

/**
 * Accepts either the global Prisma client or an interactive transaction
 * client, so callers can run conflict checks + writes atomically when
 * required (e.g. booking creation) and use the plain client otherwise.
 */
type Db = Prisma.TransactionClient | typeof prisma;

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IBookingRepository {
  findById(id: string, db?: Db): Promise<BookingWithRelations | null>;
  findMany(
    params: FindManyBookingsParams,
  ): Promise<{ items: BookingWithRelations[]; total: number }>;
  findOverlapping(db: Db, params: OverlapParams): Promise<Booking | null>;
  create(db: Db, data: CreateBookingData): Promise<Booking>;
  updateStatus(db: Db, id: string, data: UpdateStatusData): Promise<Booking>;
  update(db: Db, id: string, data: UpdateBookingData): Promise<Booking>;
  addHistory(db: Db, data: AddHistoryData): Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export interface FindManyBookingsParams {
  status?: BookingStatus;
  employeeId?: string;
  roomId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface OverlapParams {
  roomId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  /** Exclude this booking from the overlap check (used when rescheduling). */
  excludeBookingId?: string;
}

export interface CreateBookingData {
  title: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  attendeeCount: number;
  priority: BookingPriority;
  notes?: string;
  employeeId: string;
  roomId: string;
}

export interface UpdateStatusData {
  status: BookingStatus;
  cancelledAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export interface UpdateBookingData {
  title?: string;
  description?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  attendeeCount?: number;
  priority?: BookingPriority;
  notes?: string;
}

export interface AddHistoryData {
  bookingId: string;
  action: BookingHistoryAction;
  actorId?: string | null;
  note?: string;
  metadata?: Prisma.InputJsonValue;
}

// ─────────────────────────────────────────────────────────────
// Shared include shape
// ─────────────────────────────────────────────────────────────

const bookingWithRelationsInclude = {
  employee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      code: true,
      floor: true,
      building: true,
      capacity: true,
    },
  },
} satisfies Prisma.BookingInclude;

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class BookingRepository implements IBookingRepository {
  async findById(id: string, db: Db = prisma): Promise<BookingWithRelations | null> {
    return db.booking.findFirst({
      where: { id },
      include: bookingWithRelationsInclude,
    });
  }

  async findMany(
    params: FindManyBookingsParams,
  ): Promise<{ items: BookingWithRelations[]; total: number }> {
    const {
      status,
      employeeId,
      roomId,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.BookingWhereInput = {
      ...(status && { status }),
      ...(employeeId && { employeeId }),
      ...(roomId && { roomId }),
      ...((dateFrom || dateTo) && {
        date: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: bookingWithRelationsInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Finds a CONFIRMED booking for the same room whose time range overlaps
   * the requested [startTime, endTime) window. Must be called with the
   * active transaction client during booking creation/rescheduling so the
   * check and the subsequent write are atomic.
   */
  async findOverlapping(db: Db, params: OverlapParams): Promise<Booking | null> {
    const { roomId, date, startTime, endTime, excludeBookingId } = params;

    return db.booking.findFirst({
      where: {
        roomId,
        date,
        status: "CONFIRMED",
        startTime: { lt: endTime },
        endTime: { gt: startTime },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
    });
  }

  async create(db: Db, data: CreateBookingData): Promise<Booking> {
    return db.booking.create({
      data: {
        title: data.title,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        attendeeCount: data.attendeeCount,
        priority: data.priority,
        notes: data.notes,
        status: "CONFIRMED",
        employeeId: data.employeeId,
        roomId: data.roomId,
      },
    });
  }

  async updateStatus(db: Db, id: string, data: UpdateStatusData): Promise<Booking> {
    return db.booking.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.cancelledAt && { cancelledAt: data.cancelledAt }),
        ...(data.completedAt && { completedAt: data.completedAt }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async update(db: Db, id: string, data: UpdateBookingData): Promise<Booking> {
    return db.booking.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.attendeeCount !== undefined && { attendeeCount: data.attendeeCount }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  async addHistory(db: Db, data: AddHistoryData): Promise<void> {
    await db.bookingHistory.create({
      data: {
        bookingId: data.bookingId,
        action: data.action,
        actorId: data.actorId ?? undefined,
        note: data.note,
        metadata: data.metadata,
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
