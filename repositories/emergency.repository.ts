import { prisma } from "@/lib/prisma";
import type {
  EmergencyAction,
  EmergencyPriority,
  EmergencyRequest,
  EmergencyStatus,
  Prisma,
} from "@prisma/client";
import type { EmergencyRequestWithRelations } from "@/types";

/**
 * Accepts either the global Prisma client or an interactive transaction
 * client so approval workflows can mutate the booking and the emergency
 * request atomically.
 */
type Db = Prisma.TransactionClient | typeof prisma;

/** Statuses that still await an owner/admin decision. */
export const PENDING_EMERGENCY_STATUSES: EmergencyStatus[] = ["OPEN", "IN_REVIEW"];

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IEmergencyRepository {
  findById(id: string, db?: Db): Promise<EmergencyRequestWithRelations | null>;
  findMany(
    params: FindManyEmergencyParams,
  ): Promise<{ items: EmergencyRequestWithRelations[]; total: number }>;
  findPendingForBooking(
    bookingId: string,
    db?: Db,
  ): Promise<EmergencyRequest | null>;
  create(db: Db, data: CreateEmergencyData): Promise<EmergencyRequest>;
  updateStatus(db: Db, id: string, data: UpdateEmergencyStatusData): Promise<EmergencyRequest>;
}

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export interface FindManyEmergencyParams {
  status?: EmergencyStatus;
  priority?: EmergencyPriority;
  employeeId?: string;
  roomId?: string;
  bookingId?: string;
  /** Restricts results to requests raised against bookings owned by this employee. */
  bookingOwnerId?: string;
  /** Restricts results to requests where employee is requester OR booking owner. */
  userRelatedId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmergencyData {
  subject: string;
  description: string;
  department?: string;
  requestedStartTime?: Date;
  requestedEndTime?: Date;
  priority: EmergencyPriority;
  employeeId: string;
  roomId?: string;
  bookingId: string;
}

export interface UpdateEmergencyStatusData {
  status: EmergencyStatus;
  resolutionAction?: EmergencyAction;
  resolution?: string;
  transferRoomId?: string | null;
  decidedById?: string;
  decidedAt?: Date;
  resolvedAt?: Date;
}

// ─────────────────────────────────────────────────────────────
// Shared include shape
// ─────────────────────────────────────────────────────────────

const employeeSelect = {
  id: true,
  clerkId: true,
  firstName: true,
  lastName: true,
  email: true,
  department: true,
} satisfies Prisma.EmployeeSelect;

const roomSelect = {
  id: true,
  name: true,
  code: true,
  floor: true,
  building: true,
  capacity: true,
} satisfies Prisma.RoomSelect;

const emergencyWithRelationsInclude = {
  employee: { select: employeeSelect },
  room: { select: roomSelect },
  transferRoom: { select: roomSelect },
  booking: {
    select: {
      id: true,
      title: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      employeeId: true,
      roomId: true,
      employee: { select: employeeSelect },
      room: { select: roomSelect },
    },
  },
} satisfies Prisma.EmergencyRequestInclude;

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class EmergencyRepository implements IEmergencyRepository {
  async findById(
    id: string,
    db: Db = prisma,
  ): Promise<EmergencyRequestWithRelations | null> {
    return db.emergencyRequest.findFirst({
      where: { id },
      include: emergencyWithRelationsInclude,
    });
  }

  async findMany(
    params: FindManyEmergencyParams,
  ): Promise<{ items: EmergencyRequestWithRelations[]; total: number }> {
    const {
      status,
      priority,
      employeeId,
      roomId,
      bookingId,
      bookingOwnerId,
      userRelatedId,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.EmergencyRequestWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(employeeId && { employeeId }),
      ...(roomId && { roomId }),
      ...(bookingId && { bookingId }),
      ...(bookingOwnerId && { booking: { employeeId: bookingOwnerId } }),
      ...(userRelatedId && {
        OR: [
          { employeeId: userRelatedId },
          { booking: { employeeId: userRelatedId } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.emergencyRequest.findMany({
        where,
        include: emergencyWithRelationsInclude,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      prisma.emergencyRequest.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Returns an existing undecided request for the same booking. Must be
   * called with the active transaction client during creation so the
   * duplicate check and the insert are atomic.
   */
  async findPendingForBooking(
    bookingId: string,
    db: Db = prisma,
  ): Promise<EmergencyRequest | null> {
    return db.emergencyRequest.findFirst({
      where: { bookingId, status: { in: PENDING_EMERGENCY_STATUSES } },
    });
  }

  async create(db: Db, data: CreateEmergencyData): Promise<EmergencyRequest> {
    return db.emergencyRequest.create({
      data: {
        subject: data.subject,
        description: data.description,
        department: data.department,
        requestedStartTime: data.requestedStartTime,
        requestedEndTime: data.requestedEndTime,
        priority: data.priority,
        status: "OPEN",
        employeeId: data.employeeId,
        roomId: data.roomId,
        bookingId: data.bookingId,
      },
    });
  }

  async updateStatus(
    db: Db,
    id: string,
    data: UpdateEmergencyStatusData,
  ): Promise<EmergencyRequest> {
    return db.emergencyRequest.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.resolutionAction !== undefined && {
          resolutionAction: data.resolutionAction,
        }),
        ...(data.resolution !== undefined && { resolution: data.resolution }),
        ...(data.transferRoomId !== undefined && {
          transferRoomId: data.transferRoomId,
        }),
        ...(data.decidedById !== undefined && { decidedById: data.decidedById }),
        ...(data.decidedAt !== undefined && { decidedAt: data.decidedAt }),
        ...(data.resolvedAt !== undefined && { resolvedAt: data.resolvedAt }),
      },
    });
  }
}

export const emergencyRepository = new EmergencyRepository();
