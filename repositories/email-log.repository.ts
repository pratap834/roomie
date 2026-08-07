import { prisma } from "@/lib/prisma";
import type { EmailLog, EmailStatus, EmailType, Prisma } from "@prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IEmailLogRepository {
  create(data: CreateEmailLogData, db?: Db): Promise<EmailLog>;
  markSent(id: string, resendId: string | null): Promise<EmailLog>;
  markFailed(id: string, errorMessage: string): Promise<EmailLog>;
  findMany(
    params: FindManyEmailLogsParams,
  ): Promise<{ items: EmailLog[]; total: number }>;
}

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export interface CreateEmailLogData {
  type: EmailType;
  toEmail: string;
  subject: string;
  employeeId?: string | null;
  bookingId?: string | null;
  emergencyRequestId?: string | null;
}

export interface FindManyEmailLogsParams {
  type?: EmailType;
  status?: EmailStatus;
  employeeId?: string;
  bookingId?: string;
  emergencyRequestId?: string;
  page?: number;
  pageSize?: number;
}

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class EmailLogRepository implements IEmailLogRepository {
  async create(data: CreateEmailLogData, db: Db = prisma): Promise<EmailLog> {
    return db.emailLog.create({
      data: {
        type: data.type,
        status: "PENDING",
        toEmail: data.toEmail,
        subject: data.subject,
        employeeId: data.employeeId ?? undefined,
        bookingId: data.bookingId ?? undefined,
        emergencyRequestId: data.emergencyRequestId ?? undefined,
      },
    });
  }

  async markSent(id: string, resendId: string | null): Promise<EmailLog> {
    return prisma.emailLog.update({
      where: { id },
      data: {
        status: "SENT",
        resendId: resendId ?? undefined,
        sentAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<EmailLog> {
    return prisma.emailLog.update({
      where: { id },
      data: {
        status: "FAILED",
        errorMessage: errorMessage.slice(0, 1000),
      },
    });
  }

  async findMany(
    params: FindManyEmailLogsParams,
  ): Promise<{ items: EmailLog[]; total: number }> {
    const {
      type,
      status,
      employeeId,
      bookingId,
      emergencyRequestId,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.EmailLogWhereInput = {
      ...(type && { type }),
      ...(status && { status }),
      ...(employeeId && { employeeId }),
      ...(bookingId && { bookingId }),
      ...(emergencyRequestId && { emergencyRequestId }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.emailLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.emailLog.count({ where }),
    ]);

    return { items, total };
  }
}

export const emailLogRepository = new EmailLogRepository();
