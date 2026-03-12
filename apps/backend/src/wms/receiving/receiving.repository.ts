import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateReceivingOrderDto, QueryReceivingOrderDto } from './dto';

@Injectable()
export class ReceivingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReceivingOrderDto, createdBy: number) {
    return this.prisma.receivingOrder.create({
      data: {
        orderNumber: await this.generatePurchaseOrderNumber(),
        warehouseId: data.warehouseId,
        supplierName: data.supplierName,
        supplierCode: data.supplierCode,
        purchaseOrderNumber: data.purchaseOrderNumber,
        expectedDate: data.expectedDate,
        status: 'pending',
        notes: data.notes,
        createdBy,
        lines: {
          create: data.lines.map((line) => ({
            productId: line.productId,
            expectedQuantity: line.expectedQuantity,
            unitCost: line.unitCost,
            receivedQuantity: 0,
            damageQuantity: 0,
            status: 'pending',
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: {
              include: {
                barcodes: true,
              },
            },
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        createdUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryReceivingOrderDto) {
    const where: Prisma.ReceivingOrderWhereInput = {};

    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.status) where.status = query.status;

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = query.fromDate;
      if (query.toDate) where.createdAt.lte = query.toDate;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.receivingOrder.findMany({
        where,
        include: {
          lines: {
            include: {
              product: true,
              location: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          createdUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          receivedUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.receivingOrder.count({ where }),
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
    return this.prisma.receivingOrder.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: {
              include: {
                barcodes: true,
              },
            },
            location: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        createdUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        receivedUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateStatus(id: number, status: string) {
    return this.prisma.receivingOrder.update({
      where: { id },
      data: { status },
    });
  }

  async assignUser(id: number, userId: number) {
    return this.prisma.receivingOrder.update({
      where: { id },
      data: {
        assignedTo: userId,
      },
    });
  }

  async startReceiving(id: number) {
    return this.prisma.receivingOrder.update({
      where: { id },
      data: { status: 'in_progress' },
      include: {
        lines: {
          include: {
            product: {
              include: {
                barcodes: true,
              },
            },
          },
        },
      },
    });
  }

  async completeReceiving(id: number, receivedBy: number) {
    return this.prisma.receivingOrder.update({
      where: { id },
      data: {
        status: 'completed',
        receivedDate: new Date(),
        receivedBy,
      },
    });
  }

  async receiveLine(
    lineId: number,
    receivedQuantity: number,
    damageQuantity: number,
    locationId: number,
    notes?: string
  ) {
    return this.prisma.receivingOrderLine.update({
      where: { id: lineId },
      data: {
        receivedQuantity,
        damageQuantity,
        locationId,
        notes,
        status: receivedQuantity > 0 ? 'received' : 'pending',
        receivedAt: new Date(),
      },
      include: {
        product: true,
        location: true,
      },
    });
  }

  async cancel(id: number) {
    return this.prisma.receivingOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async getDamagedItems(query: { warehouseId?: number; fromDate?: Date; toDate?: Date }) {
    const where: Prisma.ReceivingOrderLineWhereInput = {
      damageQuantity: { gt: 0 },
    };

    if (query.warehouseId) {
      where.receivingOrder = { warehouseId: query.warehouseId };
    }

    if (query.fromDate || query.toDate) {
      where.receivedAt = {};
      if (query.fromDate) where.receivedAt.gte = query.fromDate;
      if (query.toDate) where.receivedAt.lte = query.toDate;
    }

    return this.prisma.receivingOrderLine.findMany({
      where,
      include: {
        product: true,
        location: true,
        receivingOrder: {
          select: {
            orderNumber: true,
            warehouseId: true,
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async generatePurchaseOrderNumber(): Promise<string> {
    const count = await this.prisma.receivingOrder.count();
    return `OC-${String(count + 1).padStart(3, '0')}`;
  }
}
