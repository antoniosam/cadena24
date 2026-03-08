import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { QueryInventoryDto, CreateInventoryTransactionDto, CreateAdjustmentDto } from './dto';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== INVENTORY ====================
  async findInventory(filters: QueryInventoryDto) {
    const where: Record<string, unknown> = {};

    if (filters.productId) where['productId'] = filters.productId;
    if (filters.locationId) where['locationId'] = filters.locationId;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;
    if (filters.status) where['status'] = filters.status;

    return this.prisma.inventory.findMany({
      where,
      include: {
        product: true,
        location: {
          select: {
            fullPath: true,
            barcode: true,
          },
        },
        warehouse: true,
      },
    });
  }

  async findInventoryByProductAndLocation(productId: number, locationId: number) {
    return this.prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
      include: {
        product: true,
        location: true,
      },
    });
  }

  async getAvailableStock(productId: number, warehouseId?: number) {
    const where: Record<string, unknown> = {
      productId,
      status: 'available',
    };

    if (warehouseId) {
      where['warehouseId'] = warehouseId;
    }

    const inventories = await this.prisma.inventory.findMany({
      where,
      select: { availableQuantity: true },
    });

    return inventories.reduce((sum, inv) => sum + inv.availableQuantity, 0);
  }

  async getStockByProduct(productId: number) {
    return this.prisma.inventory.findMany({
      where: { productId },
      include: {
        location: {
          select: {
            fullPath: true,
            barcode: true,
          },
        },
      },
    });
  }

  async getStockByLocation(locationId: number) {
    return this.prisma.inventory.findMany({
      where: { locationId },
      include: { product: true },
    });
  }

  async createOrUpdateInventory(data: {
    productId: number;
    locationId: number;
    warehouseId: number;
    quantity: number;
    operation: 'ADD' | 'SUBTRACT' | 'SET';
  }) {
    const { productId, locationId, warehouseId, quantity, operation } = data;

    const existing = await this.findInventoryByProductAndLocation(productId, locationId);

    if (existing) {
      let newQuantity: number;

      switch (operation) {
        case 'ADD':
          newQuantity = existing.quantity + quantity;
          break;
        case 'SUBTRACT':
          newQuantity = existing.quantity - quantity;
          break;
        case 'SET':
        default:
          newQuantity = quantity;
          break;
      }

      const newAvailable = newQuantity - existing.reservedQuantity;

      return this.prisma.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: newQuantity,
          availableQuantity: newAvailable,
          updatedAt: new Date(),
        },
      });
    } else {
      return this.prisma.inventory.create({
        data: {
          productId,
          locationId,
          warehouseId,
          quantity,
          availableQuantity: quantity,
          reservedQuantity: 0,
          status: 'available',
        },
      });
    }
  }

  async reserveInventory(productId: number, quantity: number, _referenceId: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        productId,
        status: 'available',
        availableQuantity: { gt: 0 },
      },
      orderBy: { lastCountDate: 'asc' },
    });

    let remainingToReserve = quantity;
    const updates: Promise<unknown>[] = [];

    for (const inventory of inventories) {
      if (remainingToReserve <= 0) break;

      const quantityToReserve = Math.min(inventory.availableQuantity, remainingToReserve);

      updates.push(
        this.prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQuantity: inventory.reservedQuantity + quantityToReserve,
            availableQuantity: inventory.availableQuantity - quantityToReserve,
          },
        })
      );

      remainingToReserve -= quantityToReserve;
    }

    await Promise.all(updates);

    if (remainingToReserve > 0) {
      throw new Error(`No se puede reservar la cantidad completa. Faltante: ${remainingToReserve}`);
    }
  }

  async releaseReservation(productId: number, quantity: number, _referenceId: string) {
    const inventories = await this.prisma.inventory.findMany({
      where: {
        productId,
        reservedQuantity: { gt: 0 },
      },
    });

    let remainingToRelease = quantity;
    const updates: Promise<unknown>[] = [];

    for (const inventory of inventories) {
      if (remainingToRelease <= 0) break;

      const quantityToRelease = Math.min(inventory.reservedQuantity, remainingToRelease);

      updates.push(
        this.prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQuantity: inventory.reservedQuantity - quantityToRelease,
            availableQuantity: inventory.availableQuantity + quantityToRelease,
          },
        })
      );

      remainingToRelease -= quantityToRelease;
    }

    await Promise.all(updates);
  }

  // ==================== TRANSACTIONS ====================
  async createTransaction(data: CreateInventoryTransactionDto) {
    return this.prisma.inventoryTransaction.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: data.quantity,
        transactionType: data.transactionType,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        userId: data.userId,
      },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      },
    });
  }

  async getTransactionHistory(filters: {
    productId?: number;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.productId) where['productId'] = filters.productId;
    if (filters.warehouseId) where['warehouseId'] = filters.warehouseId;

    if (filters.fromDate || filters.toDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.fromDate) createdAt['gte'] = filters.fromDate;
      if (filters.toDate) createdAt['lte'] = filters.toDate;
      where['createdAt'] = createdAt;
    }

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: true,
        fromLocation: { select: { fullPath: true } },
        toLocation: { select: { fullPath: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  // ==================== ADJUSTMENTS ====================
  async createAdjustment(data: CreateAdjustmentDto, createdBy: number) {
    const adjustmentNumber = await this.generateAdjustmentNumber();

    return this.prisma.inventoryAdjustment.create({
      data: {
        adjustmentNumber,
        warehouseId: data.warehouseId,
        reason: data.reason,
        status: 'draft',
        notes: data.notes,
        createdBy,
        lines: {
          create: data.lines.map((line) => ({
            productId: line.productId,
            locationId: line.locationId,
            systemQuantity: line.systemQuantity,
            physicalQuantity: line.physicalQuantity,
            difference: line.physicalQuantity - line.systemQuantity,
          })),
        },
      },
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });
  }

  async getAdjustments(warehouseId?: number, status?: string) {
    const where: Record<string, unknown> = {};

    if (warehouseId) where['warehouseId'] = warehouseId;
    if (status) where['status'] = status;

    return this.prisma.inventoryAdjustment.findMany({
      where,
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
        createdUser: { select: { firstName: true, lastName: true, email: true } },
        approvedUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdjustment(id: number) {
    return this.prisma.inventoryAdjustment.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
        createdUser: { select: { firstName: true, lastName: true, email: true } },
        approvedUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async approveAdjustment(id: number, approvedBy: number) {
    return this.prisma.inventoryAdjustment.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
      include: { lines: true },
    });
  }

  async cancelAdjustment(id: number) {
    return this.prisma.inventoryAdjustment.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async getWarehouseIdFromLocation(locationId: number): Promise<number> {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { warehouseId: true },
    });

    if (!location) {
      throw new Error(`Ubicación ${locationId} no encontrada`);
    }

    return location.warehouseId;
  }

  private async generateAdjustmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.inventoryAdjustment.count({
      where: {
        adjustmentNumber: { startsWith: `ADJ-${year}-` },
      },
    });

    return `ADJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
