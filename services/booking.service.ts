import { Prisma } from "@prisma/client";
import type { Booking } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingRepository } from "@/repositories/booking.repository";
import { roomRepository } from "@/repositories/room.repository";
import { employeeRepository } from "@/repositories/employee.repository";
import { emailService } from "@/services/email.service";
import type { BookingEmailContext } from "@/services/email.service";
import { createLogger } from "@/utils/logger";
import { buildPaginationMeta } from "@/utils/api-response";
import { parseISODate } from "@/utils/date";
import type {
  BookingWithRelations,
  PaginatedResult,
  ServiceResult,
} from "@/types";
import type {
  BookingFiltersInput,
  CancelBookingInput,
  CreateBookingInput,
  UpdateBookingInput,
} from "@/validators/booking.validator";

const log = createLogger("BookingService");

/** Interactive transactions can fail under SERIALIZABLE isolation when a
 *  genuine write conflict is detected by Postgres; retrying a handful of
 *  times resolves transient conflicts without surfacing them to the user. */
const MAX_TRANSACTION_RETRIES = 3;

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

export interface AvailabilityResult {
  occupied: boolean;
  bookedTime: { start: string; end: string } | null;
  bookedUntil: string | null;
  availableAfter: string | null;
}

/**
 * Maps a booking loaded with its relations into the presentation-agnostic
 * context the email service consumes. Reuses the relation data already
 * fetched by the repository, so no additional queries are issued.
 */
function toBookingEmailContext(
  booking: BookingWithRelations,
): BookingEmailContext {
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
// Interface
// ─────────────────────────────────────────────────────────────

export interface IBookingService {
  listBookings(
    filters: BookingFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<BookingWithRelations>>>;
  myBookings(
    employeeId: string,
    filters: Omit<BookingFiltersInput, "employeeId">,
  ): Promise<ServiceResult<PaginatedResult<BookingWithRelations>>>;
  getBookingById(
    id: string,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<BookingWithRelations>>;
  createBooking(
    input: CreateBookingInput,
    employeeId: string,
  ): Promise<ServiceResult<Booking>>;
  updateBooking(
    id: string,
    input: UpdateBookingInput,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<Booking>>;
  cancelBooking(
    id: string,
    input: CancelBookingInput,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<Booking>>;
  completeBooking(id: string, actorId: string): Promise<ServiceResult<Booking>>;
  checkAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<ServiceResult<AvailabilityResult>>;
}

// ─────────────────────────────────────────────────────────────
// Transaction helper
// ─────────────────────────────────────────────────────────────

/**
 * Runs `fn` inside a SERIALIZABLE Prisma transaction, retrying on genuine
 * serialization failures (Postgres error surfaced by Prisma as P2034).
 * SERIALIZABLE isolation is what actually prevents two concurrent requests
 * from both passing the overlap check and double-booking the same room;
 * the in-transaction overlap query alone is not sufficient under weaker
 * isolation levels.
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
// Implementation
// ─────────────────────────────────────────────────────────────

export class BookingService implements IBookingService {
  async listBookings(
    filters: BookingFiltersInput,
  ): Promise<ServiceResult<PaginatedResult<BookingWithRelations>>> {
    try {
      const page = filters.page ?? 1;
      const pageSize = filters.pageSize ?? 20;

      const { items, total } = await bookingRepository.findMany({
        status: filters.status,
        employeeId: filters.employeeId,
        roomId: filters.roomId,
        dateFrom: filters.dateFrom ? parseISODate(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? parseISODate(filters.dateTo) : undefined,
        page,
        pageSize,
      });

      return {
        ok: true,
        data: { items, meta: buildPaginationMeta(total, page, pageSize) },
      };
    } catch (error) {
      log.error("Failed to list bookings", error);
      return { ok: false, error: "Failed to retrieve bookings", code: "INTERNAL_ERROR" };
    }
  }

  async myBookings(
    employeeId: string,
    filters: Omit<BookingFiltersInput, "employeeId">,
  ): Promise<ServiceResult<PaginatedResult<BookingWithRelations>>> {
    return this.listBookings({ ...filters, employeeId });
  }

  async getBookingById(
    id: string,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<BookingWithRelations>> {
    try {
      const booking = await bookingRepository.findById(id);
      if (!booking) {
        return { ok: false, error: "Booking not found", code: "BOOKING_NOT_FOUND" };
      }

      if (!isAdminRequester && booking.employeeId !== requesterId) {
        return {
          ok: false,
          error: "You do not have permission to view this booking",
          code: "FORBIDDEN",
        };
      }

      return { ok: true, data: booking };
    } catch (error) {
      log.error("Failed to get booking by ID", error);
      return { ok: false, error: "Failed to retrieve booking", code: "INTERNAL_ERROR" };
    }
  }

  async createBooking(
    input: CreateBookingInput,
    employeeId: string,
  ): Promise<ServiceResult<Booking>> {
    try {
      const date = parseISODate(input.date);
      const startTime = new Date(input.startTime);
      const endTime = new Date(input.endTime);

      const booking = await runSerializable(async (tx) => {
        const room = await tx.room.findFirst({ where: { id: input.roomId } });

        if (!room) {
          throw new ServiceError("ROOM_NOT_FOUND", "Room not found");
        }

        if (!room.isActive || room.status !== "AVAILABLE") {
          throw new ServiceError(
            "ROOM_UNAVAILABLE",
            "Room is not available for booking",
          );
        }

        const overlap = await bookingRepository.findOverlapping(tx, {
          roomId: input.roomId,
          date,
          startTime,
          endTime,
        });

        if (overlap) {
          throw new ServiceError(
            "BOOKING_CONFLICT",
            "The room is already booked for this time slot",
          );
        }

        const created = await bookingRepository.create(tx, {
          title: input.title,
          description: input.reason,
          date,
          startTime,
          endTime,
          attendeeCount: input.attendeeCount,
          priority: input.priority,
          notes: input.notes,
          employeeId,
          roomId: input.roomId,
        });

        await bookingRepository.addHistory(tx, {
          bookingId: created.id,
          action: "CREATED",
          actorId: employeeId,
        });

        return created;
      });

      log.info("Booking created", { id: booking.id, roomId: booking.roomId, employeeId });

      // Notification is fire-and-forget: the transaction has already
      // committed, so a mail failure must not affect the result.
      await this.notifyBookingCreated(booking.id);

      return { ok: true, data: booking };
    } catch (error) {
      if (error instanceof ServiceError) {
        return { ok: false, error: error.publicMessage, code: error.code };
      }
      log.error("Failed to create booking", error);
      return { ok: false, error: "Failed to create booking", code: "INTERNAL_ERROR" };
    }
  }

  async updateBooking(
    id: string,
    input: UpdateBookingInput,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<Booking>> {
    try {
      const existing = await bookingRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Booking not found", code: "BOOKING_NOT_FOUND" };
      }

      if (!isAdminRequester && existing.employeeId !== requesterId) {
        return {
          ok: false,
          error: "You do not have permission to modify this booking",
          code: "FORBIDDEN",
        };
      }

      if (existing.status !== "CONFIRMED") {
        return {
          ok: false,
          error: "Only confirmed bookings can be updated",
          code: "BOOKING_INVALID_STATUS",
        };
      }

      if (existing.startTime <= new Date()) {
        return {
          ok: false,
          error: "Cannot modify a booking that has already started",
          code: "BOOKING_PAST",
        };
      }

      const timeChanged = Boolean(input.date || input.startTime || input.endTime);
      const nextDate = input.date ? parseISODate(input.date) : existing.date;
      const nextStart = input.startTime ? new Date(input.startTime) : existing.startTime;
      const nextEnd = input.endTime ? new Date(input.endTime) : existing.endTime;

      if (timeChanged && nextEnd <= nextStart) {
        return {
          ok: false,
          error: "End time must be after start time",
          code: "BOOKING_INVALID_TIME",
        };
      }

      const booking = await runSerializable(async (tx) => {
        if (timeChanged) {
          const overlap = await bookingRepository.findOverlapping(tx, {
            roomId: existing.roomId,
            date: nextDate,
            startTime: nextStart,
            endTime: nextEnd,
            excludeBookingId: id,
          });

          if (overlap) {
            throw new ServiceError(
              "BOOKING_CONFLICT",
              "The room is already booked for this time slot",
            );
          }
        }

        const updated = await bookingRepository.update(tx, id, {
          title: input.title,
          description: input.reason,
          date: input.date ? nextDate : undefined,
          startTime: input.startTime ? nextStart : undefined,
          endTime: input.endTime ? nextEnd : undefined,
          attendeeCount: input.attendeeCount,
          priority: input.priority,
          notes: input.notes,
        });

        await bookingRepository.addHistory(tx, {
          bookingId: id,
          action: timeChanged ? "RESCHEDULED" : "UPDATED",
          actorId: requesterId,
          metadata: input as Prisma.InputJsonValue,
        });

        return updated;
      });

      log.info("Booking updated", { id });

      if (timeChanged) {
        await this.notifyBookingRescheduled(id, {
          date: existing.date,
          startTime: existing.startTime,
          endTime: existing.endTime,
          roomName: existing.room.name,
        });
      }

      return { ok: true, data: booking };
    } catch (error) {
      if (error instanceof ServiceError) {
        return { ok: false, error: error.publicMessage, code: error.code };
      }
      log.error("Failed to update booking", error);
      return { ok: false, error: "Failed to update booking", code: "INTERNAL_ERROR" };
    }
  }

  async cancelBooking(
    id: string,
    input: CancelBookingInput,
    requesterId: string,
    isAdminRequester: boolean,
  ): Promise<ServiceResult<Booking>> {
    try {
      const existing = await bookingRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Booking not found", code: "BOOKING_NOT_FOUND" };
      }

      if (!isAdminRequester && existing.employeeId !== requesterId) {
        return {
          ok: false,
          error: "You do not have permission to cancel this booking",
          code: "FORBIDDEN",
        };
      }

      if (existing.status !== "CONFIRMED") {
        return {
          ok: false,
          error: "Only confirmed bookings can be cancelled",
          code: "BOOKING_INVALID_STATUS",
        };
      }

      const booking = await prisma.$transaction(async (tx) => {
        const updated = await bookingRepository.updateStatus(tx, id, {
          status: "CANCELLED",
          cancelledAt: new Date(),
          ...(input.reason !== undefined && { notes: input.reason }),
        });

        await bookingRepository.addHistory(tx, {
          bookingId: id,
          action: "CANCELLED",
          actorId: requesterId,
          note: input.reason,
        });

        return updated;
      });

      log.info("Booking cancelled", { id, requesterId });

      await this.notifyBookingCancelled(existing, requesterId, input.reason);

      return { ok: true, data: booking };
    } catch (error) {
      log.error("Failed to cancel booking", error);
      return { ok: false, error: "Failed to cancel booking", code: "INTERNAL_ERROR" };
    }
  }

  async completeBooking(id: string, actorId: string): Promise<ServiceResult<Booking>> {
    try {
      const existing = await bookingRepository.findById(id);
      if (!existing) {
        return { ok: false, error: "Booking not found", code: "BOOKING_NOT_FOUND" };
      }

      if (existing.status !== "CONFIRMED") {
        return {
          ok: false,
          error: "Only confirmed bookings can be completed",
          code: "BOOKING_INVALID_STATUS",
        };
      }

      const booking = await prisma.$transaction(async (tx) => {
        const updated = await bookingRepository.updateStatus(tx, id, {
          status: "COMPLETED",
          completedAt: new Date(),
        });

        await bookingRepository.addHistory(tx, {
          bookingId: id,
          action: "COMPLETED",
          actorId,
        });

        return updated;
      });

      log.info("Booking completed", { id, actorId });
      return { ok: true, data: booking };
    } catch (error) {
      log.error("Failed to complete booking", error);
      return { ok: false, error: "Failed to complete booking", code: "INTERNAL_ERROR" };
    }
  }

  async checkAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<ServiceResult<AvailabilityResult>> {
    try {
      const room = await roomRepository.findById(roomId);
      if (!room) {
        return { ok: false, error: "Room not found", code: "ROOM_NOT_FOUND" };
      }

      const overlap = await bookingRepository.findOverlapping(prisma, {
        roomId,
        date: parseISODate(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      });

      if (!overlap) {
        return {
          ok: true,
          data: { occupied: false, bookedTime: null, bookedUntil: null, availableAfter: null },
        };
      }

      // Deliberately expose only timing — never the meeting title or employee.
      return {
        ok: true,
        data: {
          occupied: true,
          bookedTime: {
            start: overlap.startTime.toISOString(),
            end: overlap.endTime.toISOString(),
          },
          bookedUntil: overlap.endTime.toISOString(),
          availableAfter: overlap.endTime.toISOString(),
        },
      };
    } catch (error) {
      log.error("Failed to check room availability", error);
      return { ok: false, error: "Failed to check availability", code: "INTERNAL_ERROR" };
    }
  }

  // ───────────────────────────────────────────────────────────
  // Notification orchestration
  //
  // Each helper is best-effort. Failures are logged and swallowed because
  // the owning transaction has already committed by the time they run.
  // ───────────────────────────────────────────────────────────

  private async notifyBookingCreated(id: string): Promise<void> {
    try {
      const booking = await bookingRepository.findById(id);
      if (!booking) return;
      emailService.sendBookingConfirmation(toBookingEmailContext(booking));
    } catch (error) {
      log.error("Failed to dispatch booking confirmation", error);
    }
  }

  private async notifyBookingRescheduled(
    id: string,
    previous: { date: Date; startTime: Date; endTime: Date; roomName: string },
  ): Promise<void> {
    try {
      const booking = await bookingRepository.findById(id);
      if (!booking) return;
      emailService.sendBookingRescheduled({
        booking: toBookingEmailContext(booking),
        previous,
      });
    } catch (error) {
      log.error("Failed to dispatch booking reschedule notice", error);
    }
  }

  private async notifyBookingCancelled(
    booking: BookingWithRelations,
    requesterId: string,
    reason?: string,
  ): Promise<void> {
    try {
      const cancelledBy =
        booking.employeeId === requesterId
          ? booking.employee
          : ((await employeeRepository.findById(requesterId)) ?? booking.employee);

      emailService.sendBookingCancellation({
        booking: toBookingEmailContext(booking),
        reason: reason ?? null,
        cancelledBy: {
          id: cancelledBy.id,
          email: cancelledBy.email,
          firstName: cancelledBy.firstName,
          lastName: cancelledBy.lastName,
        },
      });
    } catch (error) {
      log.error("Failed to dispatch booking cancellation notice", error);
    }
  }
}

export const bookingService = new BookingService();
