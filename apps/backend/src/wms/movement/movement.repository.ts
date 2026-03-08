import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMovementOrderDto, QueryMovementOrderDto } from './dto';

const lineInclude = {
  product: true,
  fromLocation: {
    select: {
      id: true,
      barcode: true,
      fullPath: true,
      name: true,
      type: true,
      capacity: true,
      maxWeight: true,
      allowMixedProducts: true,
    },
  },
  toLocation: {
    select: {
      id: true,
      barcode: true,
      fullPath: true,
      name: true,
      type: true,
      capacity: true,
      maxWeight: true,
      allowMixedProducts: true,
    },
  },
} satisfies Prisma.MovementOrderLineInclude;

const userSelect = { select: { id: true, firstName: true, lastName: true, email: true } };

@Injectable()
export class MovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovementOrderDto, createdBy: number) {
    const orderNumber = await this.generateOrderNumber();

    return this.prisma.movementOrder.create({
      data: {
        orderNumber,
        warehouseId: dto.warehouseId,
        movementType: dto.movementType,
        reason: dto.reason,
        status: 'pending',
        notes: dto.notes,
        createdBy,
        lines: {
          create: dto.lines.map((line) => ({
            productId: line.productId,
            fromLocationId: line.fromLocationId,
            toLocationId: line.toLocationId,
            quantity: line.quantity,
            movedQuantity: 0,
            status: 'pending',
          })),
        },
      },
      include: {
        lines: { include: lineInclude },
        warehouse: { select: { id: true, code: true, name: true } },
        createdUser: userSelect,
      },
    });
  }

  async findAll(query: QueryMovementOrderDto) {
    const where: Prisma.MovementOrderWhereInput = {};

    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.movementType) where.movementType = query.movementType;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.movementOrder.findMany({
        where,
        include: {
          lines: { include: lineInclude },
          warehouse: { select: { id: true, code: true, name: true } },
          createdUser: userSelect,
          executedUser: userSelect,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.movementOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return this.prisma.movementOrder.findUnique({
      where: { id },
      include: {
        lines: { include: lineInclude },
        warehouse: { select: { id: true, code: true, name: true } },
        createdUser: userSelect,
        executedUser: userSelect,
      },
    });
  }

  async startExecution(id: number) {
    return this.prisma.movementOrder.update({
      where: { id },
      data: { status: 'in_progress' },
    });
  }

  async executeLine(lineId: number, movedQuantity: number) {
    return this.prisma.movementOrderLine.update({
      where: { id: lineId },
      data: {
        movedQuantity,
        status: 'completed',
        executedAt: new Date(),
      },
      include: { product: true, fromLocation: true, toLocation: true },
    });
  }

  async complete(id: number, executedBy: number) {
    return this.prisma.movementOrder.update({
      where: { id },
      data: {
        status: 'completed',
        executedBy,
        completedAt: new Date(),
      },
      include: {
        lines: { include: lineInclude },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async cancel(id: number) {
    return this.prisma.movementOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.movementOrder.count({
      where: { orderNumber: { startsWith: `MOV-${year}-` } },
    });
    return `MOV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
