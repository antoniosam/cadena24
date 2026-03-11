import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { QueryPickListsDto } from './dto';

const PICK_LIST_INCLUDE = {
  salesOrder: {
    select: {
      id: true,
      orderNumber: true,
      clientId: true,
      client: {
        select: { id: true, name: true, code: true },
      },
      status: true,
    },
  },
  warehouse: {
    select: { id: true, code: true, name: true },
  },
  picker: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  lines: {
    include: {
      product: {
        select: { id: true, code: true, name: true, uom: true },
      },
      location: {
        select: {
          id: true,
          name: true,
          fullPath: true,
          barcode: true,
          zone: true,
          row: true,
          position: true,
          level: true,
          sequence: true,
          type: true,
        },
      },
    },
    orderBy: { sequence: 'asc' as const },
  },
};

@Injectable()
export class PickingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(filters: QueryPickListsDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.status) where['status'] = filters.status;
    if (filters.salesOrderId) where['salesOrderId'] = filters.salesOrderId;
    if (filters.pickerId) where['pickerId'] = filters.pickerId;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;

    const [items, total] = await Promise.all([
      this.prisma.pickList.findMany({
        where,
        include: PICK_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pickList.count({ where }),
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
    return this.prisma.pickList.findUnique({
      where: { id },
      include: PICK_LIST_INCLUDE,
    });
  }

  async findBySalesOrder(salesOrderId: number) {
    return this.prisma.pickList.findMany({
      where: { salesOrderId },
      include: PICK_LIST_INCLUDE,
    });
  }

  async findLine(lineId: number) {
    return this.prisma.pickListLine.findUnique({
      where: { id: lineId },
      include: {
        product: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, name: true, fullPath: true, barcode: true } },
      },
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(data: {
    pickListNumber: string;
    salesOrderId: number;
    warehouseId: number;
    totalLines: number;
    notes?: string;
    lines: Array<{
      salesOrderLineId: number;
      productId: number;
      locationId: number;
      quantityToPick: number;
      sequence: number;
    }>;
  }) {
    return this.prisma.pickList.create({
      data: {
        pickListNumber: data.pickListNumber,
        salesOrderId: data.salesOrderId,
        warehouseId: data.warehouseId,
        totalLines: data.totalLines,
        pickedLines: 0,
        status: 'pending',
        notes: data.notes,
        lines: {
          create: data.lines.map((line) => ({
            salesOrderLineId: line.salesOrderLineId,
            productId: line.productId,
            locationId: line.locationId,
            quantityToPick: line.quantityToPick,
            quantityPicked: 0,
            sequence: line.sequence,
            status: 'pending',
          })),
        },
      },
      include: PICK_LIST_INCLUDE,
    });
  }

  // ── Status transitions ────────────────────────────────────────────────────

  async assignPicker(id: number, pickerId: number) {
    return this.prisma.pickList.update({
      where: { id },
      data: { pickerId },
      include: PICK_LIST_INCLUDE,
    });
  }

  async start(id: number) {
    return this.prisma.pickList.update({
      where: { id },
      data: { status: 'in_progress', startedAt: new Date() },
      include: PICK_LIST_INCLUDE,
    });
  }

  async complete(id: number) {
    return this.prisma.pickList.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
      include: PICK_LIST_INCLUDE,
    });
  }

  async cancel(id: number) {
    return this.prisma.pickList.update({
      where: { id },
      data: { status: 'cancelled' },
      include: PICK_LIST_INCLUDE,
    });
  }

  // ── Line operations ───────────────────────────────────────────────────────

  async updateLine(
    lineId: number,
    data: {
      quantityPicked: number;
      status: string;
      notes?: string;
      pickedAt?: Date;
    }
  ) {
    return this.prisma.pickListLine.update({
      where: { id: lineId },
      data,
    });
  }

  async incrementPickedLines(pickListId: number) {
    return this.prisma.pickList.update({
      where: { id: pickListId },
      data: { pickedLines: { increment: 1 } },
    });
  }

  async getPendingLines(pickListId: number) {
    return this.prisma.pickListLine.findMany({
      where: { pickListId, status: 'pending' },
    });
  }

  async getAllLines(pickListId: number) {
    return this.prisma.pickListLine.findMany({
      where: { pickListId },
      include: {
        product: { select: { id: true, code: true, name: true } },
        location: { select: { id: true, name: true, fullPath: true } },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  // ── Inventory helpers ─────────────────────────────────────────────────────

  async getInventoryForProduct(productId: number) {
    return this.prisma.inventory.findMany({
      where: {
        productId,
        reservedQuantity: { gt: 0 },
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            fullPath: true,
            barcode: true,
            zone: true,
            row: true,
            position: true,
            level: true,
            sequence: true,
            type: true,
          },
        },
      },
      orderBy: { reservedQuantity: 'desc' },
    });
  }

  async getSalesOrderWithLines(salesOrderId: number) {
    return this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        lines: {
          include: {
            product: { select: { id: true, code: true, name: true } },
          },
        },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async updateSalesOrderLinePickedQty(lineId: number, pickedQuantity: number, status: string) {
    return this.prisma.salesOrderLine.update({
      where: { id: lineId },
      data: { pickedQuantity, status },
    });
  }

  async updateSalesOrderStatus(salesOrderId: number, status: string) {
    return this.prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { status },
    });
  }

  // ── Number generation ─────────────────────────────────────────────────────

  async generatePickListNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.pickList.count({
      where: { pickListNumber: { startsWith: `PICK-${year}-` } },
    });
    return `PICK-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
