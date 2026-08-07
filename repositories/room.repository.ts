import { prisma } from "@/lib/prisma";
import type { Room, RoomStatus, RoomType, Prisma } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────────────────────

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findMany(params: FindManyRoomsParams): Promise<{ items: Room[]; total: number }>;
  findActive(): Promise<Room[]>;
  create(data: CreateRoomData): Promise<Room>;
  update(id: string, data: UpdateRoomData): Promise<Room>;
  updateStatus(id: string, status: RoomStatus): Promise<Room>;
  delete(id: string): Promise<Room>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────
// Input types
// ─────────────────────────────────────────────────────────────

export interface FindManyRoomsParams {
  status?: RoomStatus;
  type?: RoomType;
  minCapacity?: number;
  maxCapacity?: number;
  floor?: number;
  building?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateRoomData {
  name: string;
  code: string;
  description?: string;
  floor: number;
  building?: string;
  capacity: number;
  type?: RoomType;
  amenities?: string[];
  imageUrl?: string;
}

export type UpdateRoomData = Partial<
  Omit<CreateRoomData, "code"> & {
    status: RoomStatus;
    isActive: boolean;
  }
>;

// ─────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────

export class RoomRepository implements IRoomRepository {
  async findById(id: string): Promise<Room | null> {
    return prisma.room.findFirst({
      where: { id },
    });
  }

  async findByCode(code: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { code },
    });
  }

  async findMany(
    params: FindManyRoomsParams,
  ): Promise<{ items: Room[]; total: number }> {
    const {
      status,
      type,
      minCapacity,
      maxCapacity,
      floor,
      building,
      isActive,
      search,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.RoomWhereInput = {
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(floor !== undefined && { floor }),
      ...(building && { building: { equals: building, mode: "insensitive" } }),
      ...(isActive !== undefined && { isActive }),
      ...(minCapacity !== undefined && { capacity: { gte: minCapacity } }),
      ...(maxCapacity !== undefined && {
        capacity: {
          ...(minCapacity !== undefined ? { gte: minCapacity } : {}),
          lte: maxCapacity,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { building: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ floor: "asc" }, { name: "asc" }],
      }),
      prisma.room.count({ where }),
    ]);

    return { items, total };
  }

  async findActive(): Promise<Room[]> {
    return prisma.room.findMany({
      where: { isActive: true, status: "AVAILABLE" },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
    });
  }

  async create(data: CreateRoomData): Promise<Room> {
    return prisma.room.create({ data });
  }

  async update(id: string, data: UpdateRoomData): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    return prisma.room.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Room> {
    return prisma.room.delete({
      where: { id },
    });
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.room.count({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return count > 0;
  }
}

export const roomRepository = new RoomRepository();
