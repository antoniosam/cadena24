import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from './inventory.repository';
import {
  QueryInventoryDto,
  ReserveInventoryDto,
  ReleaseReservationDto,
  UpdateInventoryDto,
  CreateInventoryTransactionDto,
  CreateAdjustmentDto,
  TransactionType,
} from './dto';

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  // ==================== INVENTORY QUERIES ====================
  async getInventory(filters: QueryInventoryDto) {
    return this.repository.findInventory(filters);
  }

  async getAvailableStock(productId: number, warehouseId?: number) {
    return this.repository.getAvailableStock(productId, warehouseId);
  }

  async getStockByProduct(productId: number) {
    return this.repository.getStockByProduct(productId);
  }

  async getStockByLocation(locationId: number) {
    return this.repository.getStockByLocation(locationId);
  }

  // ==================== INVENTORY OPERATIONS ====================
  async updateInventory(dto: UpdateInventoryDto, userId?: number) {
    const warehouseId = await this.repository.getWarehouseIdFromLocation(dto.locationId);

    const result = await this.repository.createOrUpdateInventory({
      productId: dto.productId,
      locationId: dto.locationId,
      warehouseId,
      quantity: dto.quantity,
      operation: dto.operation,
    });

    await this.createTransaction({
      productId: dto.productId,
      warehouseId: result.warehouseId,
      toLocationId: dto.locationId,
      quantity: dto.quantity,
      transactionType: TransactionType.ADJUST,
      referenceType: 'MANUAL_UPDATE',
      notes: `Manual ${dto.operation} operation`,
      userId,
    });

    return result;
  }

  /**
   * Update inventory without creating an automatic transaction.
   * Use this when you want to manage transactions manually (e.g., in receiving orders).
   */
  async updateInventoryWithoutTransaction(dto: UpdateInventoryDto) {
    const warehouseId = await this.repository.getWarehouseIdFromLocation(dto.locationId);

    return this.repository.createOrUpdateInventory({
      productId: dto.productId,
      locationId: dto.locationId,
      warehouseId,
      quantity: dto.quantity,
      operation: dto.operation,
    });
  }

  async reserveInventory(dto: ReserveInventoryDto) {
    const availableStock = await this.repository.getAvailableStock(dto.productId);

    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${dto.quantity}`
      );
    }

    return this.repository.reserveInventory(dto.productId, dto.quantity, dto.referenceId);
  }

  async releaseReservation(dto: ReleaseReservationDto) {
    return this.repository.releaseReservation(dto.productId, dto.quantity, dto.referenceId);
  }

  // ==================== TRANSACTIONS ====================
  async createTransaction(dto: CreateInventoryTransactionDto) {
    return this.repository.createTransaction(dto);
  }

  async getTransactionHistory(filters: {
    productId?: number;
    warehouseId?: number;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    return this.repository.getTransactionHistory(filters);
  }

  // ==================== ADJUSTMENTS ====================
  async createAdjustment(dto: CreateAdjustmentDto, createdBy: number) {
    for (const line of dto.lines) {
      const inventory = await this.repository.findInventoryByProductAndLocation(
        line.productId,
        line.locationId
      );

      if (inventory && inventory.quantity !== line.systemQuantity) {
        throw new BadRequestException(
          `Discrepancia en cantidad del sistema para producto ${line.productId} ` +
            `en ubicación ${line.locationId}. ` +
            `Esperado: ${inventory.quantity}, Proporcionado: ${line.systemQuantity}`
        );
      }
    }

    return this.repository.createAdjustment(dto, createdBy);
  }

  async getAdjustments(warehouseId?: number, status?: string) {
    return this.repository.getAdjustments(warehouseId, status);
  }

  async getAdjustment(id: number) {
    const adjustment = await this.repository.getAdjustment(id);
    if (!adjustment) {
      throw new NotFoundException(`Ajuste con ID ${id} no encontrado`);
    }
    return adjustment;
  }

  async approveAdjustment(id: number, approvedBy: number) {
    const adjustment = await this.getAdjustment(id);

    if (adjustment.status !== 'draft') {
      throw new BadRequestException('Solo se pueden aprobar ajustes en estado borrador');
    }

    const approved = await this.repository.approveAdjustment(id, approvedBy);

    for (const line of approved.lines) {
      if (line.difference !== 0) {
        await this.repository.createOrUpdateInventory({
          productId: line.productId,
          locationId: line.locationId,
          warehouseId: adjustment.warehouseId,
          quantity: Math.abs(line.difference),
          operation: line.difference > 0 ? 'ADD' : 'SUBTRACT',
        });

        await this.createTransaction({
          productId: line.productId,
          warehouseId: adjustment.warehouseId,
          toLocationId: line.locationId,
          quantity: Math.abs(line.difference),
          transactionType: TransactionType.ADJUST,
          referenceType: 'ADJUSTMENT',
          referenceId: String(id),
          notes: `Ajuste ${adjustment.adjustmentNumber} - Razón: ${adjustment.reason}`,
          userId: approvedBy,
        });
      }
    }

    return approved;
  }

  async cancelAdjustment(id: number) {
    const adjustment = await this.getAdjustment(id);

    if (adjustment.status !== 'draft') {
      throw new BadRequestException('Solo se pueden cancelar ajustes en estado borrador');
    }

    return this.repository.cancelAdjustment(id);
  }
}
