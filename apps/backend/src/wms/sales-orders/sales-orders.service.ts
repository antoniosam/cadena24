import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesOrdersRepository } from './sales-orders.repository';
import { InventoryService } from '../inventory/inventory.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  QuerySalesOrdersDto,
  ValidateStockDto,
  SalesOrderStatus,
} from './dto';
import { SalesOrder } from '@prisma/client';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly repository: SalesOrdersRepository,
    private readonly inventoryService: InventoryService
  ) {}

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(query: QuerySalesOrdersDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const order = await this.repository.findOne(id);
    if (!order) {
      throw new NotFoundException(`Orden de venta con ID ${id} no encontrada`);
    }
    return order;
  }

  // ── Validate stock ────────────────────────────────────────────────────────

  async validateStock(dto: ValidateStockDto) {
    const results = await Promise.all(
      dto.items.map(async (item) => {
        const available = await this.inventoryService.getAvailableStock(item.productId);
        const canFulfill = available >= item.quantity;
        return {
          productId: item.productId,
          requested: item.quantity,
          available,
          canFulfill,
          message: canFulfill ? undefined : `Solo hay ${available} unidades disponibles`,
        };
      })
    );

    return {
      valid: results.every((r) => r.canFulfill),
      items: results,
    };
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateSalesOrderDto, createdBy: number) {
    // 1. Get primary warehouse
    const warehouse = await this.repository.getPrimaryWarehouse();
    if (!warehouse) {
      throw new NotFoundException('No hay almacén activo configurado');
    }

    // 2. Validate products exist and are active
    for (const line of dto.lines) {
      const product = await this.repository.getProductById(line.productId);
      if (!product) {
        throw new NotFoundException(`Producto con ID ${line.productId} no encontrado`);
      }
      if (!product.isActive) {
        throw new BadRequestException(`El producto ${product.name} no está activo`);
      }
    }

    // 3. Validate stock availability for all lines
    const stockValidation = await this.validateStock({
      items: dto.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    });

    if (!stockValidation.valid) {
      const insufficient = stockValidation.items
        .filter((i) => !i.canFulfill)
        .map((i) => i.message)
        .join('; ');
      throw new BadRequestException(`Stock insuficiente para crear la orden: ${insufficient}`);
    }

    // 4. Create order in DB
    const order = await this.repository.create(dto, warehouse.id, createdBy);

    // 5. Reserve inventory automatically (FIFO)
    for (const line of dto.lines) {
      await this.inventoryService.reserveInventory({
        productId: line.productId,
        quantity: line.quantity,
        referenceType: 'SALES_ORDER',
        referenceId: String(order.id),
      });
    }

    return order;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateSalesOrderDto) {
    const order = await this.findOne(id);

    if (order.status === 'cancelled' || order.status === 'shipped') {
      throw new BadRequestException('No se puede modificar una orden cancelada o enviada');
    }

    return this.repository.update(id, dto);
  }

  async updatePriority(id: number, priority: string) {
    const order = await this.findOne(id);

    if (order.status === 'shipped' || order.status === 'cancelled') {
      throw new BadRequestException(
        'No se puede cambiar la prioridad de una orden enviada o cancelada'
      );
    }

    return this.repository.updatePriority(id, priority);
  }

  // ── Can pick ──────────────────────────────────────────────────────────────

  async canPick(id: number) {
    const order = (await this.findOne(id)) as {
      status: string;
      orderNumber: string;
      lines: { status: string }[];
    };

    const canPick = order.status === 'pending';
    const pendingLines = order.lines?.filter((l) => l.status === 'pending') ?? [];

    return {
      canPick,
      orderId: id,
      orderNumber: order.orderNumber,
      status: order.status,
      pendingLines: pendingLines.length,
      reason: canPick
        ? undefined
        : `La orden está en estado "${order.status}" y no puede pasar a picking`,
    };
  }

  // ── Reserve / Release inventory ───────────────────────────────────────────

  async reserveInventory(id: number) {
    const order = await this.findOne(id);

    if (order.status !== 'pending') {
      throw new BadRequestException(
        'Solo se puede reservar inventario para órdenes en estado pendiente'
      );
    }

    for (const line of order.lines ?? []) {
      await this.inventoryService.reserveInventory({
        productId: line.productId,
        quantity: line.orderedQuantity,
        referenceType: 'SALES_ORDER',
        referenceId: String(id),
      });
    }

    return { success: true, message: 'Inventario reservado correctamente' };
  }

  async releaseInventory(id: number) {
    const order = await this.findOne(id);

    for (const line of order.lines ?? []) {
      await this.inventoryService.releaseReservation({
        productId: line.productId,
        quantity: line.orderedQuantity,
        referenceId: String(id),
      });
    }

    return { success: true, message: 'Reservas de inventario liberadas' };
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(id: number) {
    const order = await this.findOne(id);

    if (order.status === 'shipped') {
      throw new BadRequestException('No se puede cancelar una orden ya enviada');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('La orden ya está cancelada');
    }

    // Release inventory reservations
    for (const line of order.lines ?? []) {
      try {
        await this.inventoryService.releaseReservation({
          productId: line.productId,
          quantity: line.orderedQuantity,
          referenceId: String(id),
        });
      } catch {
        // Ignore release errors (might already be released)
      }
    }

    return this.repository.cancel(id);
  }

  // ── Update status (used internally by picking module) ─────────────────────

  async updateStatus(id: number, status: SalesOrderStatus) {
    await this.findOne(id);
    const extra = status === SalesOrderStatus.SHIPPED ? { shippedDate: new Date() } : undefined;
    return this.repository.updateStatus(id, status, extra);
  }
}
