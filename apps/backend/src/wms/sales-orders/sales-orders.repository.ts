import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  QuerySalesOrdersDto,
  SalesOrderStatus,
} from './dto';

const ORDER_INCLUDE = {
  lines: {
    include: {
      product: {
        select: {
          id: true,
          code: true,
          name: true,
          uom: true,
        },
      },
    },
    orderBy: { id: 'asc' as const },
  },
  warehouse: {
    select: { id: true, code: true, name: true },
  },
  client: {
    select: { id: true, code: true, name: true, email: true, phone: true },
  },
  createdUser: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

@Injectable()
export class SalesOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(filters: QuerySalesOrdersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.status) where['status'] = filters.status;
    if (filters.priority) where['priority'] = filters.priority;
    if (filters.customerName) {
      where['client'] = { name: { contains: filters.customerName } };
    }
    if (filters.fromDate || filters.toDate) {
      const orderDate: Record<string, Date> = {};
      if (filters.fromDate) orderDate['gte'] = new Date(filters.fromDate);
      if (filters.toDate) orderDate['lte'] = new Date(filters.toDate);
      where['orderDate'] = orderDate;
    }

    const [items, total] = await Promise.all([
      (this.prisma as any).salesOrder.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: [{ priority: 'desc' }, { orderDate: 'asc' }],
        skip,
        take: limit,
      }),
      (this.prisma as any).salesOrder.count({ where }),
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
    return (this.prisma as any).salesOrder.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return (this.prisma as any).salesOrder.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async create(dto: CreateSalesOrderDto, warehouseId: number, createdBy: number) {
    const orderNumber = await this.generateOrderNumber();
    const totalAmount = dto.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

    return (this.prisma as any).salesOrder.create({
      data: {
        orderNumber,
        warehouseId,
        clientId: dto.clientId,
        orderDate: new Date(),
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        priority: dto.priority ?? 'normal',
        status: 'pending',
        totalAmount,
        notes: dto.notes,
        createdBy,
        lines: {
          create: dto.lines.map((line) => ({
            productId: line.productId,
            orderedQuantity: line.quantity,
            pickedQuantity: 0,
            shippedQuantity: 0,
            unitPrice: line.unitPrice,
            subtotal: line.quantity * line.unitPrice,
            status: 'pending',
            notes: line.notes,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateSalesOrderDto) {
    return (this.prisma as any).salesOrder.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : undefined,
        notes: dto.notes,
      },
      include: ORDER_INCLUDE,
    });
  }

  async updatePriority(id: number, priority: string) {
    return (this.prisma as any).salesOrder.update({
      where: { id },
      data: { priority },
      include: ORDER_INCLUDE,
    });
  }

  async updateStatus(id: number, status: SalesOrderStatus, extra?: { shippedDate?: Date }) {
    return (this.prisma as any).salesOrder.update({
      where: { id },
      data: {
        status,
        ...(extra ?? {}),
      },
      include: ORDER_INCLUDE,
    });
  }

  async updateLineStatus(lineId: number, status: string) {
    return (this.prisma as any).salesOrderLine.update({
      where: { id: lineId },
      data: { status },
    });
  }

  async cancel(id: number) {
    return (this.prisma as any).salesOrder.update({
      where: { id },
      data: {
        status: 'cancelled',
        lines: {
          updateMany: {
            where: { salesOrderId: id, status: { not: 'shipped' } },
            data: { status: 'cancelled' },
          },
        },
      },
      include: ORDER_INCLUDE,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  async getPrimaryWarehouse() {
    return (this.prisma as any).warehouse.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async getProductById(productId: number) {
    return (this.prisma as any).product.findUnique({
      where: { id: productId },
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await (this.prisma as any).salesOrder.count({
      where: {
        orderNumber: { startsWith: `SO-${year}-` },
      },
    });
    return `SO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
