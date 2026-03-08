import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MovementRepository } from './movement.repository';
import {
  CreateMovementOrderDto,
  ExecuteMovementLineDto,
  ValidateMovementDto,
  SuggestLocationDto,
  QueryMovementOrderDto,
} from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { LocationsService } from '../locations/locations.service';
import { ProductsService } from '../products/products.service';
import { TransactionType } from '../inventory/dto';

@Injectable()
export class MovementService {
  constructor(
    private readonly repository: MovementRepository,
    private readonly inventoryService: InventoryService,
    private readonly locationsService: LocationsService,
    private readonly productsService: ProductsService
  ) {}

  async create(dto: CreateMovementOrderDto, createdBy: number) {
    // Validate all lines before creating the order
    for (const line of dto.lines) {
      await this.validateMovement({
        productId: line.productId,
        fromLocationId: line.fromLocationId,
        toLocationId: line.toLocationId,
        quantity: line.quantity,
      });
    }

    return this.repository.create(dto, createdBy);
  }

  async findAll(query: QueryMovementOrderDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const order = await this.repository.findOne(id);
    if (!order) {
      throw new NotFoundException(`Orden de movimiento con ID ${id} no encontrada`);
    }
    return order;
  }

  async startExecution(id: number) {
    const order = await this.findOne(id);

    if (order.status !== 'pending') {
      throw new BadRequestException('Solo se pueden iniciar órdenes en estado pendiente');
    }

    return this.repository.startExecution(id);
  }

  async executeLine(orderId: number, dto: ExecuteMovementLineDto, userId: number) {
    const order = await this.findOne(orderId);

    if (order.status !== 'in_progress') {
      throw new BadRequestException('La orden debe estar en proceso para ejecutar líneas');
    }

    const line = order.lines.find((l) => l.id === dto.lineId);
    if (!line) {
      throw new NotFoundException('Línea no encontrada en la orden de movimiento');
    }

    if (line.status === 'completed') {
      throw new BadRequestException('Esta línea ya fue ejecutada');
    }

    // Validate stock and capacity before execution
    await this.validateMovement({
      productId: line.productId,
      fromLocationId: line.fromLocationId,
      toLocationId: line.toLocationId,
      quantity: dto.movedQuantity,
    });

    // Subtract from origin location
    await this.inventoryService.updateInventoryWithoutTransaction({
      productId: line.productId,
      locationId: line.fromLocationId,
      quantity: dto.movedQuantity,
      operation: 'SUBTRACT',
    });

    // Add to destination location
    await this.inventoryService.updateInventoryWithoutTransaction({
      productId: line.productId,
      locationId: line.toLocationId,
      quantity: dto.movedQuantity,
      operation: 'ADD',
    });

    // Register audit transaction
    await this.inventoryService.createTransaction({
      productId: line.productId,
      warehouseId: order.warehouseId,
      fromLocationId: line.fromLocationId,
      toLocationId: line.toLocationId,
      quantity: dto.movedQuantity,
      transactionType: TransactionType.MOVE,
      referenceType: 'MOVEMENT_ORDER',
      referenceId: String(order.id),
      notes: `${order.movementType}: ${order.orderNumber}`,
      userId,
    });

    return this.repository.executeLine(dto.lineId, dto.movedQuantity);
  }

  async complete(id: number, executedBy: number) {
    const order = await this.findOne(id);

    if (order.status !== 'in_progress') {
      throw new BadRequestException('La orden debe estar en proceso para completarse');
    }

    const pendingLines = order.lines.filter((l) => l.status === 'pending');
    if (pendingLines.length > 0) {
      throw new BadRequestException(
        `Todas las líneas deben ejecutarse antes de completar. Pendientes: ${pendingLines.length}`
      );
    }

    return this.repository.complete(id, executedBy);
  }

  async cancel(id: number) {
    const order = await this.findOne(id);

    if (order.status === 'completed') {
      throw new BadRequestException('No se pueden cancelar órdenes completadas');
    }

    if (order.status === 'in_progress') {
      throw new BadRequestException('No se pueden cancelar órdenes en proceso');
    }

    return this.repository.cancel(id);
  }

  // ── Validation & Suggestions ───────────────────────────────────────────────

  async validateMovement(dto: ValidateMovementDto) {
    // 1. Validate product exists
    await this.productsService.findOne(dto.productId);

    // 2. Validate locations exist
    const fromLocation = await this.locationsService.findOne(dto.fromLocationId);
    const toLocation = await this.locationsService.findOne(dto.toLocationId);

    if (!fromLocation.isActive) {
      throw new BadRequestException('La ubicación de origen está inactiva');
    }
    if (!toLocation.isActive) {
      throw new BadRequestException('La ubicación de destino está inactiva');
    }

    // 3. Validate available stock at origin
    const originStock = await this.inventoryService.getStockByLocation(dto.fromLocationId);
    const productInOrigin = originStock.find((inv) => inv.productId === dto.productId);

    if (!productInOrigin || productInOrigin.availableQuantity < dto.quantity) {
      throw new BadRequestException(
        `Stock disponible insuficiente en ubicación origen. Disponible: ${productInOrigin?.availableQuantity ?? 0}`
      );
    }

    // 4. Validate destination capacity
    const destStock = await this.inventoryService.getStockByLocation(dto.toLocationId);
    const currentOccupancy = destStock.reduce((sum, inv) => sum + inv.quantity, 0);
    const availableCapacity = toLocation.capacity - currentOccupancy;

    if (availableCapacity < dto.quantity) {
      throw new BadRequestException(
        `La ubicación destino no tiene capacidad suficiente. Disponible: ${availableCapacity}`
      );
    }

    // 5. Validate max weight
    const product = await this.productsService.findOne(dto.productId);
    if (product.weight && toLocation.maxWeight) {
      const incomingWeight = product.weight * dto.quantity;
      const currentWeight = destStock.reduce(
        (sum, inv) => sum + ((inv.product?.weight ?? 0) as number) * inv.quantity,
        0
      );
      if (currentWeight + incomingWeight > toLocation.maxWeight) {
        throw new BadRequestException('Se excede el límite de peso en la ubicación destino');
      }
    }

    // 6. Validate mixed products policy
    if (!toLocation.allowMixedProducts && destStock.length > 0) {
      const hasOtherProducts = destStock.some((inv) => inv.productId !== dto.productId);
      if (hasOtherProducts) {
        throw new BadRequestException('La ubicación destino no permite productos mixtos');
      }
    }

    return { valid: true, message: 'Movimiento válido' };
  }

  async suggestOptimalLocation(dto: SuggestLocationDto) {
    // Strategy 1: Consolidate with existing stock of the same product
    const existingStock = await this.inventoryService.getStockByProduct(dto.productId);

    const withCapacity = existingStock.filter((inv) => {
      const used = inv.quantity;
      const cap = (inv.location as any)?.capacity ?? 0;
      return cap - used >= dto.quantity;
    });

    if (withCapacity.length > 0) {
      // Prefer locations with most existing stock (consolidation)
      withCapacity.sort((a, b) => b.quantity - a.quantity);
      return { location: withCapacity[0].location, strategy: 'consolidation' };
    }

    // Strategy 2: Find available empty locations
    const validTypes = ['receiving', 'storage', 'picking', 'shipping'] as const;
    type LocationType = (typeof validTypes)[number];
    const preferredType: LocationType = validTypes.includes(dto.preferredType as LocationType)
      ? (dto.preferredType as LocationType)
      : 'storage';

    const allLocationsResult = await this.locationsService.findAll({
      type: preferredType,
      isActive: true,
      availableOnly: true,
      limit: 50,
    });

    const available = allLocationsResult.items.filter((loc) => {
      return loc.isActive && loc.capacity > 0;
    });

    if (available.length === 0) {
      throw new NotFoundException('No se encontraron ubicaciones disponibles');
    }

    // Order by sequence for proximity
    available.sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));

    return { location: available[0], strategy: 'empty_location' };
  }
}
