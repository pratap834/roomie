import { prisma } from "@/lib/prisma";
import type { Employee, EmployeeRole, EmployeeStatus, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByClerkId(clerkId: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findMany(params: FindManyEmployeesParams): Promise<{ items: Employee[]; total: number }>;
  create(data: CreateEmployeeData): Promise<Employee>;
  update(id: string, data: UpdateEmployeeData): Promise<Employee>;
  softDelete(id: string): Promise<Employee>;
  existsByEmail(email: string): Promise<boolean>;
  existsByClerkId(clerkId: string): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export interface FindManyEmployeesParams {
  role?: EmployeeRole;
  status?: EmployeeStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateEmployeeData {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
}

export type UpdateEmployeeData = Partial<
  CreateEmployeeData & {
    status: EmployeeStatus;
  }
>;

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class EmployeeRepository implements IEmployeeRepository {
  async findById(id: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByClerkId(clerkId: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: { clerkId, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async findMany(
    params: FindManyEmployeesParams,
  ): Promise<{ items: Employee[]; total: number }> {
    const {
      role,
      status,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.employee.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: CreateEmployeeData): Promise<Employee> {
    return prisma.employee.create({ data });
  }

  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    return prisma.employee.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Employee> {
    return prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.employee.count({
      where: { email, deletedAt: null },
    });
    return count > 0;
  }

  async existsByClerkId(clerkId: string): Promise<boolean> {
    const count = await prisma.employee.count({
      where: { clerkId, deletedAt: null },
    });
    return count > 0;
  }
}

export const employeeRepository = new EmployeeRepository();
