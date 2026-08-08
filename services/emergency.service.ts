import { Prisma } from "@prisma/client";
import type {
  EmergencyAction,
  EmergencyRequest,
  EmergencyStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { bookingRepository } from "@/repositories/booking.repository";
import {
  emergencyRepository,
  PENDING_EMERGENCY_STATUSES,
} from "@/repositories/emergency.repository";
import { emailService } from "@/services/email.service";
import type {
  BookingEmailContext,
  EmergencyEmailContext,
} from "@/services/email.service";
import { createLogger } from "@/utils/logger";
import { buildPaginationMeta } from "@/utils/api-response";
import { parseISODate } from "@/utils/date";
import type {
  EmergencyContactDetails,
  EmergencyRequestWithRelations,
  PaginatedResult,
  ServiceResult,
} from "@/types";
import type {
  AdminEmergencyDecisionInput,
  CreateEmergencyRequestInput,
  EmergencyFiltersInput,
  ResolveEmergencyRequestInput,
} from "@/validators/emergency.validator";

const log = createLogger("EmergencyService");

const MAX_TRANSACTION_RETRIES = 3;

/** Booking statuses an override request may legitimately target. */
const OVERRIDABLE_BOOKING_STATUSES: string[] = ["CONFIRMED", "APPROVED"];

/**
 * Internal control-flow error used to abort a transaction and carry a
 * ServiceResult error code back out to the calling method. Never leaves
 * this file.
 */
class ServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly publicMessage: string,
  ) {
    super(code);
    this.name = "ServiceError";
  }
}

/** Human-readable outcome labels used in notification copy. */
const ACTION_LABELS: Record<EmergencyAction, string> = {
  KEEP_BOOKING: "Existing booking kept",
  ROOM_TRANSFER: "Room transfer",
  RESCHEDULE: "Booking rescheduled",
  REDUCE_DURATION: "Meeting duration reduced",
  CONTACT_EMPLOYEE: "Booking owner will make contact",
};

/** Actions that accommodate the requester versus decline the request. */
const APPROVING_ACTIONS: EmergencyAction[] = [
  "ROOM_TRANSFER",
  "RESCHEDULE",
  "REDUCE_DURATION",
];

export interface ResolveEmergencyResult {
  emergencyRequest: EmergencyRequest;
  /** Populated only when the owner chose CONTACT_EMPLOYEE. */
  contact: EmergencyContactDetails | null;
}

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IEmergencyService {
  listRequests(
    filters: EmergencyFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>>;
  listRequestsForOwner(
    ownerId: string,
    filters: EmergencyFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>>;
  listRequestsForUser(
    userId: string,
    filters: EmergencyFiltersInput,
    isAdmin: boolean,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>>;
  getRequestById(
    id: string,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<EmergencyRequestWithRelations>>;
  createRequest(
    input: CreateEmergencyRequestInput,
    employeeId: string,
  ): Promise<ServiceResult<EmergencyRequest>>;
  resolveRequest(
    id: string,
    input: ResolveEmergencyRequestInput,
    actorId: string,
    isAdminActor: boolean,
  ): Promise<ServiceResult<ResolveEmergencyResult>>;
  adminDecide(
    id: string,
    input: AdminEmergencyDecisionInput,
    adminId: string,
  ): Promise<ServiceResult<EmergencyRequest>>;
  decideRequest(
    id: string,
    input: AdminEmergencyDecisionInput,
    actorId: string,
    isAdminActor: boolean,
  ): Promise<ServiceResult<EmergencyRequest>>;
}

// ─────────────────────────────────────────────────────────────
// Transaction helper
// ─────────────────────────────────────────────────────────────

/**
 * Runs `fn` inside a SERIALIZABLE transaction, retrying genuine serialization
 * failures (P2034). SERIALIZABLE is required here for the same reason as in
 * booking creation: two concurrent approvals must not both pass the
 * room-overlap check and produce a double booking.
 */
async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let attempt = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      attempt += 1;
      const isSerializationFailure =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (!isSerializationFailure || attempt >= MAX_TRANSACTION_RETRIES) {
        throw error;
      }

      log.warn("Transaction serialization conflict, retrying", { attempt });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Email context mappers
// ─────────────────────────────────────────────────────────────

function toEmergencyEmailContext(
  request: EmergencyRequestWithRelations,
): EmergencyEmailContext {
  return {
    id: request.id,
    subject: request.subject,
    description: request.description,
    priority: request.priority,
    department: request.department,
    requestedStartTime: request.requestedStartTime,
    requestedEndTime: request.requestedEndTime,
    requester: request.employee,
  };
}

/**
 * Builds the booking email context from a freshly loaded booking. Reuses the
 * booking repository's relation include so no extra queries are issued for
 * the room or organizer.
 */
async function loadBookingEmailContext(
  bookingId: string,
): Promise<BookingEmailContext | null> {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) return null;

  return {
    id: booking.id,
    title: booking.title,
    description: booking.description,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    attendeeCount: booking.attendeeCount,
    room: {
      name: booking.room.name,
      code: booking.room.code,
      floor: booking.room.floor,
      building: booking.room.building,
    },
    organizer: booking.employee,
  };
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class EmergencyService implements IEmergencyService {
  async listRequests(
    filters: EmergencyFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>> {
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;

      const { items, total } = await emergencyRepository.findMany({
        status: filters.status,
        priority: filters.priority,
        employeeId: filters.employeeId,
        roomId: filters.roomId,
        bookingId: filters.bookingId,
        page,
        pageSize,
      });

      return {
        ok: true,
        data: { items, meta: buildPaginationMeta(total, page, pageSize) },
      };
    } catch (error) {
      log.error("Failed to list emergency requests", error);
      return {
        ok: false,
        error: "Failed to retrieve emergency requests",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Requests raised against bookings the given employee owns — the inbox a
   * booking owner acts on.
   */
  async listRequestsForOwner(
    ownerId: string,
    filters: EmergencyFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>> {
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;

      const { items, total } = await emergencyRepository.findMany({
        status: filters.status,
        priority: filters.priority,
        roomId: filters.roomId,
        bookingId: filters.bookingId,
        bookingOwnerId: ownerId,
        page,
        pageSize,
      });

      return {
        ok: true,
        data: { items, meta: buildPaginationMeta(total, page, pageSize) },
      };
    } catch (error) {
      log.error("Failed to list emergency requests for owner", error);
      return {
        ok: false,
        error: "Failed to retrieve emergency requests",
        code: "INTERNAL_ERROR",
      };
    }
  }

  async listRequestsForUser(
    userId: string,
    filters: EmergencyFiltersInput,
    isAdmin: boolean,
  ): Promise<ServiceResult<PaginatedResult<EmergencyRequestWithRelations>>> {
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;
      const scope = filters.scope ?? (isAdmin ? "all" : "my_requests");

      let employeeId: string | undefined;
      let bookingOwnerId: string | undefined;
      let userRelatedId: string | undefined;

      if (scope === "my_requests") {
        employeeId = userId;
      } else if (scope === "incoming") {
        bookingOwnerId = userId;
      } else if (scope === "all") {
        if (!isAdmin) {
          userRelatedId = userId;
        }
      } else {
        userRelatedId = userId;
      }

      const { items, total } = await emergencyRepository.findMany({
        status: filters.status,
        priority: filters.priority,
        employeeId: filters.employeeId ?? employeeId,
        roomId: filters.roomId,
        bookingId: filters.bookingId,
        bookingOwnerId,
        userRelatedId,
        page,
        pageSize,
      });

      return {
        ok: true,
        data: { items, meta: buildPaginationMeta(total, page, pageSize) },
      };
    } catch (error) {
      log.error("Failed to list emergency requests for user", error);
      return {
        ok: false,
        error: "Failed to retrieve emergency requests",
        code: "INTERNAL_ERROR",
      };
    }
  }

  async getRequestById(
    id: string,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<EmergencyRequestWithRelations>> {
    try {
      const request = await emergencyRepository.findById(id);
      if (!request) {
        return {
          ok: false,
          error: "Emergency request not found",
          code: "EMERGENCY_NOT_FOUND",
        };
      }

      const isOwner = request.booking?.employeeId === requesterId;
      const isRequester = request.employeeId === requesterId;

      if (!isAdminRequester && !isOwner && !isRequester) {
        return {
          ok: false,
          error: "You do not have permission to view this emergency request",
          code: "FORBIDDEN",
        };
      }

      return { ok: true, data: request };
    } catch (error) {
      log.error("Failed to get emergency request by ID", error);
      return {
        ok: false,
        error: "Failed to retrieve emergency request",
        code: "INTERNAL_ERROR",
      };
    }
  }

  async createRequest(
    input: CreateEmergencyRequestInput,
    employeeId: string,
  ): Promise<ServiceResult<EmergencyRequest>> {
    try {
      const created = await runSerializable(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: { id: input.bookingId },
          select: { id: true, status: true, employeeId: true, roomId: true },
        });

        if (!booking) {
          throw new ServiceError("BOOKING_NOT_FOUND", "Booking not found");
        }

        if (booking.employeeId === employeeId) {
          throw new ServiceError(
            "EMERGENCY_OWN_BOOKING",
            "You cannot raise an emergency request against your own booking",
          );
        }

        if (!OVERRIDABLE_BOOKING_STATUSES.includes(booking.status)) {
          throw new ServiceError(
            "BOOKING_INVALID_STATUS",
            "Emergency requests can only be raised against active bookings",
          );
        }

        // Duplicate check runs inside the transaction so two concurrent
        // submissions cannot both find "no pending request" and insert.
        const pending = await emergencyRepository.findPendingForBooking(
          input.bookingId,
          tx,
        );

        if (pending) {
          throw new ServiceError(
            "EMERGENCY_DUPLICATE",
            "A pending emergency request already exists for this booking",
          );
        }

        const request = await emergencyRepository.create(tx, {
          subject: input.subject,
          description: input.reason,
          department: input.department,
          requestedStartTime: input.requestedStartTime
            ? new Date(input.requestedStartTime)
            : undefined,
          requestedEndTime: input.requestedEndTime
            ? new Date(input.requestedEndTime)
            : undefined,
          priority: input.priority,
          employeeId,
          roomId: booking.roomId,
          bookingId: booking.id,
        });

        await bookingRepository.addHistory(tx, {
          bookingId: booking.id,
          action: "EMERGENCY_REQUESTED",
          actorId: employeeId,
          note: input.subject,
          metadata: { emergencyRequestId: request.id, priority: input.priority },
        });

        return request;
      });

      log.info("Emergency request created", {
        id: created.id,
        bookingId: created.bookingId,
        employeeId,
      });

      await this.notifyRequestCreated(created.id);

      return { ok: true, data: created };
    } catch (error) {
      if (error instanceof ServiceError) {
        return { ok: false, error: error.publicMessage, code: error.code };
      }
      log.error("Failed to create emergency request", error);
      return {
        ok: false,
        error: "Failed to create emergency request",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Applies the booking owner's decision. The booking mutation, the emergency
   * status transition, and the booking history entry all happen inside one
   * SERIALIZABLE transaction, so the three can never diverge. Notifications
   * are dispatched only after the transaction commits.
   */
  async resolveRequest(
    id: string,
    input: ResolveEmergencyRequestInput,
    actorId: string,
    isAdminActor: boolean,
  ): Promise<ServiceResult<ResolveEmergencyResult>> {
    try {
      const existing = await emergencyRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Emergency request not found",
          code: "EMERGENCY_NOT_FOUND",
        };
      }

      if (!existing.booking) {
        return {
          ok: false,
          error: "The booking referenced by this request no longer exists",
          code: "BOOKING_NOT_FOUND",
        };
      }

      if (!isAdminActor && existing.booking.employeeId !== actorId) {
        return {
          ok: false,
          error: "Only the booking owner may respond to this request",
          code: "FORBIDDEN",
        };
      }

      if (!PENDING_EMERGENCY_STATUSES.includes(existing.status)) {
        return {
          ok: false,
          error: "This emergency request has already been decided",
          code: "EMERGENCY_INVALID_STATUS",
        };
      }

      if (!OVERRIDABLE_BOOKING_STATUSES.includes(existing.booking.status)) {
        return {
          ok: false,
          error:
            "The referenced booking is no longer active, so it cannot be modified",
          code: "BOOKING_INVALID_STATUS",
        };
      }

      const bookingId = existing.booking.id;
      const previous = {
        date: existing.booking.date,
        startTime: existing.booking.startTime,
        endTime: existing.booking.endTime,
        roomName: existing.booking.room.name,
      };

      const outcome = await runSerializable(async (tx) => {
        // Re-read the booking under SERIALIZABLE isolation: the pre-checks
        // above ran outside the transaction and the state may have moved.
        const booking = await tx.booking.findFirst({
          where: { id: bookingId },
          select: {
            id: true,
            status: true,
            roomId: true,
            date: true,
            startTime: true,
            endTime: true,
            attendeeCount: true,
          },
        });

        if (!booking) {
          throw new ServiceError("BOOKING_NOT_FOUND", "Booking not found");
        }

        if (!OVERRIDABLE_BOOKING_STATUSES.includes(booking.status)) {
          throw new ServiceError(
            "BOOKING_INVALID_STATUS",
            "The referenced booking is no longer active",
          );
        }

        const request = await tx.emergencyRequest.findFirst({
          where: { id, status: { in: PENDING_EMERGENCY_STATUSES } },
          select: { id: true },
        });

        if (!request) {
          throw new ServiceError(
            "EMERGENCY_INVALID_STATUS",
            "This emergency request has already been decided",
          );
        }

        let transferRoomId: string | null = null;
        let bookingRescheduled = false;

        switch (input.action) {
          case "ROOM_TRANSFER": {
            if (input.targetRoomId === booking.roomId) {
              throw new ServiceError(
                "EMERGENCY_INVALID_ACTION",
                "The booking is already assigned to that room",
              );
            }

            const targetRoom = await tx.room.findFirst({
              where: { id: input.targetRoomId },
            });

            if (!targetRoom) {
              throw new ServiceError("ROOM_NOT_FOUND", "Target room not found");
            }

            if (!targetRoom.isActive || targetRoom.status !== "AVAILABLE") {
              throw new ServiceError(
                "ROOM_UNAVAILABLE",
                "The target room is not available for booking",
              );
            }

            if (targetRoom.capacity < booking.attendeeCount) {
              throw new ServiceError(
                "EMERGENCY_INVALID_ACTION",
                "The target room cannot accommodate the expected attendees",
              );
            }

            const overlap = await bookingRepository.findOverlapping(tx, {
              roomId: input.targetRoomId,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              excludeBookingId: booking.id,
            });

            if (overlap) {
              throw new ServiceError(
                "BOOKING_CONFLICT",
                "The target room is already booked for this time slot",
              );
            }

            await tx.booking.update({
              where: { id: booking.id },
              data: { roomId: input.targetRoomId },
            });

            transferRoomId = booking.roomId;

            await bookingRepository.addHistory(tx, {
              bookingId: booking.id,
              action: "ROOM_TRANSFERRED",
              actorId,
              note: input.note,
              metadata: {
                emergencyRequestId: id,
                fromRoomId: booking.roomId,
                toRoomId: input.targetRoomId,
              },
            });
            break;
          }

          case "RESCHEDULE": {
            const nextDate = parseISODate(input.date);
            const nextStart = new Date(input.startTime);
            const nextEnd = new Date(input.endTime);

            const overlap = await bookingRepository.findOverlapping(tx, {
              roomId: booking.roomId,
              date: nextDate,
              startTime: nextStart,
              endTime: nextEnd,
              excludeBookingId: booking.id,
            });

            if (overlap) {
              throw new ServiceError(
                "BOOKING_CONFLICT",
                "The room is already booked for the new time slot",
              );
            }

            await bookingRepository.update(tx, booking.id, {
              date: nextDate,
              startTime: nextStart,
              endTime: nextEnd,
            });

            bookingRescheduled = true;

            await bookingRepository.addHistory(tx, {
              bookingId: booking.id,
              action: "RESCHEDULED",
              actorId,
              note: input.note,
              metadata: {
                emergencyRequestId: id,
                fromStartTime: booking.startTime.toISOString(),
                fromEndTime: booking.endTime.toISOString(),
                toStartTime: nextStart.toISOString(),
                toEndTime: nextEnd.toISOString(),
              },
            });
            break;
          }

          case "REDUCE_DURATION": {
            const nextEnd = new Date(input.endTime);

            if (nextEnd >= booking.endTime) {
              throw new ServiceError(
                "EMERGENCY_INVALID_ACTION",
                "The new end time must be earlier than the current end time",
              );
            }

            if (nextEnd <= booking.startTime) {
              throw new ServiceError(
                "BOOKING_INVALID_TIME",
                "The new end time must be after the booking start time",
              );
            }

            // Shrinking the window can only free capacity, so no overlap
            // re-check is required.
            await bookingRepository.update(tx, booking.id, {
              endTime: nextEnd,
            });

            bookingRescheduled = true;

            await bookingRepository.addHistory(tx, {
              bookingId: booking.id,
              action: "DURATION_REDUCED",
              actorId,
              note: input.note,
              metadata: {
                emergencyRequestId: id,
                fromEndTime: booking.endTime.toISOString(),
                toEndTime: nextEnd.toISOString(),
              },
            });
            break;
          }

          case "KEEP_BOOKING":
          case "CONTACT_EMPLOYEE": {
            // The booking itself is untouched; only the request is decided.
            await bookingRepository.addHistory(tx, {
              bookingId: booking.id,
              action: "EMERGENCY_KEPT",
              actorId,
              note: input.note,
              metadata: { emergencyRequestId: id, action: input.action },
            });
            break;
          }
        }

        const approved = APPROVING_ACTIONS.includes(input.action);
        const now = new Date();

        const updatedRequest = await emergencyRepository.updateStatus(tx, id, {
          status: approved ? "APPROVED" : "REJECTED",
          resolutionAction: input.action,
          resolution: input.note ?? ACTION_LABELS[input.action],
          transferRoomId,
          decidedById: actorId,
          decidedAt: now,
          resolvedAt: now,
        });

        return { updatedRequest, bookingRescheduled, approved };
      });

      log.info("Emergency request resolved", {
        id,
        action: input.action,
        actorId,
      });

      await this.notifyResolution({
        requestId: id,
        bookingId,
        action: input.action,
        approved: outcome.approved,
        note: input.note ?? null,
        bookingRescheduled: outcome.bookingRescheduled,
        previous,
      });

      const contact: EmergencyContactDetails | null =
        input.action === "CONTACT_EMPLOYEE"
          ? {
              requesterName: `${existing.employee.firstName} ${existing.employee.lastName}`,
              requesterEmail: existing.employee.email,
              requesterPhone: null,
              requesterDepartment:
                existing.department ?? existing.employee.department,
            }
          : null;

      return {
        ok: true,
        data: { emergencyRequest: outcome.updatedRequest, contact },
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        return { ok: false, error: error.publicMessage, code: error.code };
      }
      log.error("Failed to resolve emergency request", error);
      return {
        ok: false,
        error: "Failed to resolve emergency request",
        code: "INTERNAL_ERROR",
      };
    }
  }

  /**
   * Admin override: approves or rejects a pending request without applying a
   * booking accommodation. Used when an admin adjudicates on the owner's
   * behalf (e.g. an unresponsive owner).
   */
  async adminDecide(
    id: string,
    input: AdminEmergencyDecisionInput,
    adminId: string,
  ): Promise<ServiceResult<EmergencyRequest>> {
    return this.decideRequest(id, input, adminId, true);
  }

  async decideRequest(
    id: string,
    input: AdminEmergencyDecisionInput,
    actorId: string,
    isAdminActor: boolean,
  ): Promise<ServiceResult<EmergencyRequest>> {
    try {
      const existing = await emergencyRepository.findById(id);

      if (!existing) {
        return {
          ok: false,
          error: "Emergency request not found",
          code: "EMERGENCY_NOT_FOUND",
        };
      }

      const isOwner = existing.booking?.employeeId === actorId;

      if (!isAdminActor && !isOwner) {
        return {
          ok: false,
          error: "Only the booking owner or an admin may decide this request",
          code: "FORBIDDEN",
        };
      }

      if (!PENDING_EMERGENCY_STATUSES.includes(existing.status)) {
        return {
          ok: false,
          error: "This emergency request has already been decided",
          code: "EMERGENCY_INVALID_STATUS",
        };
      }

      const status: EmergencyStatus =
        input.decision === "APPROVE" ? "APPROVED" : "REJECTED";

      const updated = await prisma.$transaction(async (tx) => {
        const request = await tx.emergencyRequest.findFirst({
          where: { id, status: { in: PENDING_EMERGENCY_STATUSES } },
          select: { id: true },
        });

        if (!request) {
          throw new ServiceError(
            "EMERGENCY_INVALID_STATUS",
            "This emergency request has already been decided",
          );
        }

        const now = new Date();

        const result = await emergencyRepository.updateStatus(tx, id, {
          status,
          resolution: input.resolution ?? (input.decision === "APPROVE" ? "Request approved" : "Request rejected"),
          decidedById: actorId,
          decidedAt: now,
          resolvedAt: now,
        });

        if (existing.bookingId) {
          if (status === "APPROVED") {
            // Reassign the booking to the emergency requester
            const requester = await tx.employee.findUnique({
              where: { id: existing.employeeId },
              select: { firstName: true, lastName: true },
            });

            const currentBooking = await tx.booking.findUnique({
              where: { id: existing.bookingId },
              select: { title: true },
            });

            const newTitle = requester
              ? `${requester.firstName} ${requester.lastName} — ${currentBooking?.title ?? "Booking"}`
              : currentBooking?.title ?? "Booking";

            await bookingRepository.update(tx, existing.bookingId, {
              employeeId: existing.employeeId,
              title: newTitle,
            });
          }

          await bookingRepository.addHistory(tx, {
            bookingId: existing.bookingId,
            action: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
            actorId,
            note: input.resolution,
            metadata: { emergencyRequestId: id, decidedBy: isAdminActor ? "ADMIN" : "OWNER" },
          });
        }

        return result;
      });

      log.info("Emergency request decided", {
        id,
        decision: input.decision,
        actorId,
        isOwner,
        isAdmin: isAdminActor,
      });

      return { ok: true, data: updated };
    } catch (error) {
      if (error instanceof ServiceError) {
        return { ok: false, error: error.publicMessage, code: error.code };
      }
      log.error("Failed to decide emergency request", error);
      return {
        ok: false,
        error: "Failed to decide emergency request",
        code: "INTERNAL_ERROR",
      };
    }
  }

  // ───────────────────────────────────────────────────────────
  // Notification orchestration
  //
  // Every notify* helper is best-effort: it is awaited only long enough to
  // assemble the email context, and any failure is logged rather than
  // propagated, because the database transaction has already committed.
  // ───────────────────────────────────────────────────────────

  private async notifyRequestCreated(requestId: string): Promise<void> {
    try {
      const request = await emergencyRepository.findById(requestId);
      if (!request?.bookingId) return;

      const booking = await loadBookingEmailContext(request.bookingId);
      if (!booking) return;

      console.log(
        `\n📧 [Emergency Request Notification]\n` +
        `   Recipient (Booking Owner): ${booking.organizer.firstName} ${booking.organizer.lastName} (${booking.organizer.email})\n` +
        `   Requester: ${request.employee.firstName} ${request.employee.lastName} (${request.employee.email})\n` +
        `   Room: ${booking.room.name}\n` +
        `   Subject: ${request.subject}\n` +
        `   Review Link: ${env.NEXT_PUBLIC_APP_URL}/emergency/${request.id}\n`,
      );

      emailService.sendEmergencyRequest({
        emergency: toEmergencyEmailContext(request),
        booking,
      });
    } catch (error) {
      log.error("Failed to dispatch emergency request notification", error);
    }
  }

  private async notifyResolution(params: {
    requestId: string;
    bookingId: string;
    action: EmergencyAction;
    approved: boolean;
    note: string | null;
    bookingRescheduled: boolean;
    previous: { date: Date; startTime: Date; endTime: Date; roomName: string };
  }): Promise<void> {
    try {
      const request = await emergencyRepository.findById(params.requestId);
      if (!request) return;

      const booking = await loadBookingEmailContext(params.bookingId);
      if (!booking) return;

      const emergency = toEmergencyEmailContext(request);

      if (params.approved) {
        emailService.sendEmergencyApproved({
          emergency,
          booking,
          outcome: ACTION_LABELS[params.action],
          note: params.note,
        });
      } else {
        emailService.sendEmergencyRejected({
          emergency,
          reason: params.note,
          contact:
            params.action === "CONTACT_EMPLOYEE"
              ? {
                  name: `${booking.organizer.firstName} ${booking.organizer.lastName}`,
                  email: booking.organizer.email,
                }
              : null,
        });
      }

      // The booking owner's own calendar entry changed, so re-issue their
      // invite alongside the requester's decision notice.
      if (params.bookingRescheduled || params.action === "ROOM_TRANSFER") {
        emailService.sendBookingRescheduled({
          booking,
          previous: params.previous,
          reason: `Emergency override: ${ACTION_LABELS[params.action]}`,
        });
      }
    } catch (error) {
      log.error("Failed to dispatch emergency resolution notification", error);
    }
  }

  private async notifyAdminDecision(
    requestId: string,
    input: AdminEmergencyDecisionInput,
    status: EmergencyStatus,
  ): Promise<void> {
    try {
      const request = await emergencyRepository.findById(requestId);
      if (!request) return;

      const emergency = toEmergencyEmailContext(request);

      if (status === "REJECTED") {
        emailService.sendEmergencyRejected({
          emergency,
          reason: input.resolution ?? null,
          contact: null,
        });
        return;
      }

      if (!request.bookingId) return;

      const booking = await loadBookingEmailContext(request.bookingId);
      if (!booking) return;

      emailService.sendEmergencyApproved({
        emergency,
        booking,
        outcome: "Approved by an administrator",
        note: input.resolution ?? null,
      });
    } catch (error) {
      log.error("Failed to dispatch admin decision notification", error);
    }
  }
}

export const emergencyService = new EmergencyService();
