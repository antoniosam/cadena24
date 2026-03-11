import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PickingRepository } from './picking.repository';
import { InventoryService } from '../inventory/inventory.service';
import { GeneratePickListDto, AssignPickerDto, PickLineDto, QueryPickListsDto } from './dto';
import { TransactionType } from '../inventory/dto';

@Injectable()
export class PickingService {
  constructor(
    private readonly repository: PickingRepository,
    private readonly inventoryService: InventoryService
  ) {}

  // ── Queries ───────────────────────────────────────────────────────────────

  async findAll(query: QueryPickListsDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const pickList = await this.repository.findOne(id);
    if (!pickList) {
      throw new NotFoundException(`Pick list con ID ${id} no encontrada`);
    }
    return pickList;
  }

  async getOptimizedRoute(id: number) {
    const pickList = await this.findOne(id);
    return {
      pickListId: id,
      totalLines: pickList.totalLines,
      lines: pickList.lines,
    };
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  async generate(dto: GeneratePickListDto) {
    // 1. Load sales order with lines
    const salesOrder = await this.repository.getSalesOrderWithLines(dto.salesOrderId);

    if (!salesOrder) {
      throw new NotFoundException(`Orden de venta con ID ${dto.salesOrderId} no encontrada`);
    }

    if (salesOrder.status !== 'pending') {
      throw new BadRequestException(
        `La orden de venta está en estado "${salesOrder.status}" y no puede generar pick list. Solo se permiten órdenes en estado "pending"`
      );
    }

    if (!salesOrder.lines || salesOrder.lines.length === 0) {
      throw new BadRequestException('La orden de venta no tiene líneas');
    }

    // 2. Check for existing active pick lists
    const existingPickLists = await this.repository.findBySalesOrder(dto.salesOrderId);
    const activePickList = existingPickLists.find(
      (pl) => pl.status !== 'cancelled' && pl.status !== 'completed'
    );

    if (activePickList) {
      throw new BadRequestException(
        `Ya existe una pick list activa (${activePickList.pickListNumber}) para esta orden de venta`
      );
    }

    // 3. Build pick lines from reserved inventory (FIFO by location sequence)
    const pickLines: Array<{
      salesOrderLineId: number;
      productId: number;
      locationId: number;
      quantityToPick: number;
      sequence: number;
    }> = [];

    for (const orderLine of salesOrder.lines) {
      const productId = orderLine.productId;
      let remainingQty = orderLine.orderedQuantity;

      // Get inventory records with reservations for this product
      const inventoryRecords = await this.repository.getInventoryForProduct(productId);

      for (const inventory of inventoryRecords) {
        if (remainingQty <= 0) break;

        const pickQty = Math.min(inventory.reservedQuantity, remainingQty);

        const locationSeq = this.calculateLocationSequence(
          inventory.location as {
            type: string;
            sequence: number;
          }
        );

        pickLines.push({
          salesOrderLineId: orderLine.id,
          productId,
          locationId: inventory.locationId,
          quantityToPick: pickQty,
          sequence: locationSeq,
        });

        remainingQty -= pickQty;
      }

      if (remainingQty > 0) {
        throw new BadRequestException(
          `No se puede asignar la cantidad completa del producto ID ${productId}. Faltante: ${remainingQty}`
        );
      }
    }

    // 4. Sort lines by sequence for optimized route
    pickLines.sort((a, b) => a.sequence - b.sequence);

    // 5. Generate pick list number
    const pickListNumber = await this.repository.generatePickListNumber();

    // 6. Create pick list
    const pickList = await this.repository.create({
      pickListNumber,
      salesOrderId: salesOrder.id,
      warehouseId: salesOrder.warehouseId,
      totalLines: pickLines.length,
      notes: dto.notes,
      lines: pickLines,
    });

    // 7. Update sales order status → picking
    await this.repository.updateSalesOrderStatus(salesOrder.id, 'picking');

    return pickList;
  }

  // ── Assign picker ─────────────────────────────────────────────────────────

  async assignPicker(id: number, dto: AssignPickerDto) {
    const pickList = await this.findOne(id);

    if (pickList.status === 'completed' || pickList.status === 'cancelled') {
      throw new BadRequestException(
        'No se puede asignar picker a una pick list completada o cancelada'
      );
    }

    return this.repository.assignPicker(id, dto.pickerId);
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  async start(id: number) {
    const pickList = await this.findOne(id);

    if (pickList.status !== 'pending') {
      throw new BadRequestException(
        `La pick list está en estado "${pickList.status}". Solo se pueden iniciar pick lists en estado "pending"`
      );
    }

    return this.repository.start(id);
  }

  // ── Pick line ─────────────────────────────────────────────────────────────

  async pickLine(pickListId: number, dto: PickLineDto) {
    const pickList = await this.findOne(pickListId);

    if (pickList.status !== 'in_progress') {
      throw new BadRequestException(
        `La pick list está en estado "${pickList.status}". Debe estar "in_progress" para registrar picking`
      );
    }

    const line = await this.repository.findLine(dto.lineId);

    if (!line || line.pickListId !== pickListId) {
      throw new NotFoundException('Línea no encontrada en esta pick list');
    }

    if (line.status === 'picked' || line.status === 'short') {
      throw new BadRequestException('Esta línea ya fue procesada');
    }

    if (dto.quantityPicked > line.quantityToPick) {
      throw new BadRequestException(
        `No se puede surtir más de lo solicitado. Solicitado: ${line.quantityToPick}, Intentado: ${dto.quantityPicked}`
      );
    }

    const isShort = dto.quantityPicked < line.quantityToPick;
    const lineStatus = isShort ? 'short' : 'picked';

    // Update line
    await this.repository.updateLine(dto.lineId, {
      quantityPicked: dto.quantityPicked,
      status: lineStatus,
      notes: dto.notes,
      pickedAt: new Date(),
    });

    // Increment picked lines counter
    await this.repository.incrementPickedLines(pickListId);

    return {
      lineId: dto.lineId,
      quantityPicked: dto.quantityPicked,
      status: lineStatus,
      isShort,
      missing: isShort ? line.quantityToPick - dto.quantityPicked : 0,
    };
  }

  // ── Complete ──────────────────────────────────────────────────────────────

  async complete(id: number, userId: number) {
    const pickList = await this.findOne(id);

    if (pickList.status !== 'in_progress') {
      throw new BadRequestException(
        `La pick list está en estado "${pickList.status}". Debe estar "in_progress" para completarse`
      );
    }

    // Verify all lines are processed (no pending ones)
    const pendingLines = await this.repository.getPendingLines(id);

    if (pendingLines.length > 0) {
      throw new BadRequestException(
        `Hay ${pendingLines.length} líneas pendientes por surtir. Procésalas o márcalas antes de completar`
      );
    }

    const allLines = await this.repository.getAllLines(id);

    // Process each picked/short line
    for (const line of allLines) {
      if (line.quantityPicked <= 0) continue;

      // 1. Release reservation for picked quantity
      await this.inventoryService.releaseReservation({
        productId: line.productId,
        quantity: line.quantityPicked,
        referenceId: String(pickList.salesOrderId),
      });

      // 2. Deduct stock from location
      await this.inventoryService.updateInventoryWithoutTransaction({
        productId: line.productId,
        locationId: line.locationId,
        quantity: line.quantityPicked,
        operation: 'SUBTRACT',
      });

      // 3. Register inventory transaction
      const warehouseId = (pickList as unknown as { warehouseId: number }).warehouseId;
      await this.inventoryService.createTransaction({
        productId: line.productId,
        warehouseId,
        fromLocationId: line.locationId,
        toLocationId: undefined,
        quantity: line.quantityPicked,
        transactionType: TransactionType.PICK,
        referenceType: 'PICK_LIST',
        referenceId: String(id),
        notes: `Picking: ${pickList.pickListNumber}`,
        userId,
      });

      // 4. Update sales order line picked quantity
      const lineStatus = line.quantityPicked >= line.quantityToPick ? 'picked' : 'partial';
      await this.repository.updateSalesOrderLinePickedQty(
        line.salesOrderLineId,
        line.quantityPicked,
        lineStatus
      );
    }

    // Mark pick list completed
    await this.repository.complete(id);

    // Update sales order status → picked (if all lines are picked/partial/short)
    const salesOrder = await this.repository.getSalesOrderWithLines(pickList.salesOrderId);

    if (salesOrder) {
      const allProcessed = salesOrder.lines.every(
        (l) => l.status === 'picked' || l.status === 'partial' || l.status === 'cancelled'
      );

      if (allProcessed) {
        await this.repository.updateSalesOrderStatus(salesOrder.id, 'picked');
      }
    }

    return this.findOne(id);
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(id: number) {
    const pickList = await this.findOne(id);

    if (pickList.status === 'completed') {
      throw new BadRequestException('No se puede cancelar una pick list completada');
    }

    if (pickList.status === 'cancelled') {
      throw new BadRequestException('La pick list ya está cancelada');
    }

    // If it was in_progress, revert sales order status back to pending
    if (pickList.status === 'in_progress' || pickList.status === 'pending') {
      await this.repository.updateSalesOrderStatus(pickList.salesOrderId, 'pending');
    }

    return this.repository.cancel(id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private calculateLocationSequence(location: { type: string; sequence: number }): number {
    let seq = 0;

    // Prioritize picking type locations
    if (location.type === 'picking') seq += 0;
    else if (location.type === 'storage') seq += 100000;
    else seq += 200000;

    // Add location sequence for ordering within type
    seq += location.sequence;

    return seq;
  }
}
