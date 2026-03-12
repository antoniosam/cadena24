import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DamagedItem } from '@cadena24-wms/shared';
import { ReceivingRepository } from './receiving.repository';
import {
  CreateReceivingOrderDto,
  ReceiveLineDto,
  QueryReceivingOrderDto,
  QueryDamagedItemsDto,
} from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { LocationsService } from '../locations/locations.service';
import { TransactionType } from '../inventory/dto';
import { PrismaService } from '../../app/prisma/prisma.service';

@Injectable()
export class ReceivingService {
  constructor(
    private readonly repository: ReceivingRepository,
    private readonly inventoryService: InventoryService,
    private readonly locationsService: LocationsService,
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateReceivingOrderDto, createdBy: number) {
    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${dto.warehouseId} not found`);
    }

    if (!warehouse.isActive) {
      throw new BadRequestException('Cannot create receiving order in inactive warehouse');
    }

    // Validate all products exist
    for (const line of dto.lines) {
      const product = await this.prisma.product.findUnique({
        where: { id: line.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${line.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }
    }

    return this.repository.create(dto, createdBy);
  }

  async findAll(query: QueryReceivingOrderDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: number) {
    const order = await this.repository.findOne(id);
    if (!order) {
      throw new NotFoundException(`Receiving order with ID ${id} not found`);
    }
    return order;
  }

  async startReceiving(id: number) {
    const order = await this.findOne(id);

    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be started');
    }

    return this.repository.startReceiving(id);
  }

  async getFilteredProductsForUser(orderId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { classificationId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.classificationId) {
      throw new BadRequestException('User does not have a classification');
    }

    const order = await this.findOne(orderId);
    if (!order.lines) {
      return [];
    }

    return order.lines.filter((line) => line.product?.classificationId === user.classificationId);
  }

  async getReceivingLocations(warehouseId: number) {
    // Get all receiving type locations for the warehouse
    const locations = await this.prisma.location.findMany({
      where: {
        warehouseId,
        type: 'receiving',
        isActive: true,
      },
      orderBy: [{ zone: 'asc' }, { row: 'asc' }, { position: 'asc' }, { level: 'asc' }],
    });

    if (locations.length === 0) {
      throw new NotFoundException(`No receiving locations found for warehouse ${warehouseId}`);
    }

    return locations;
  }

  async receiveLine(receivingOrderId: number, dto: ReceiveLineDto, userId: number) {
    const order = await this.findOne(receivingOrderId);

    if (order.status !== 'in_progress') {
      throw new BadRequestException('Order must be in progress to receive lines');
    }

    const line = order.lines?.find((l) => l.id === dto.lineId);
    if (!line) {
      throw new NotFoundException('Line not found in receiving order');
    }

    // Validate location exists and is of type "receiving"
    const location = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${dto.locationId} not found`);
    }

    if (location.type !== 'receiving') {
      throw new BadRequestException('Location must be of type "receiving"');
    }

    if (location.warehouseId !== order.warehouseId) {
      throw new BadRequestException('Location must belong to the same warehouse as the order');
    }

    if (!location.isActive) {
      throw new BadRequestException('Location is not active');
    }

    // Calculate good quantity (received - damaged)
    const goodQuantity = dto.receivedQuantity - (dto.damageQuantity || 0);

    // Update line
    const updatedLine = await this.repository.receiveLine(
      dto.lineId,
      dto.receivedQuantity,
      dto.damageQuantity || 0,
      dto.locationId,
      dto.notes
    );

    // Update inventory only with good quantity (excluding damaged items)
    // Use updateInventoryWithoutTransaction to avoid duplicate transaction creation
    if (goodQuantity > 0) {
      await this.inventoryService.updateInventoryWithoutTransaction({
        productId: line.productId,
        locationId: dto.locationId,
        quantity: goodQuantity,
        operation: 'ADD',
      });

      // Register transaction
      await this.inventoryService.createTransaction({
        productId: line.productId,
        warehouseId: order.warehouseId,
        toLocationId: dto.locationId,
        quantity: goodQuantity,
        transactionType: TransactionType.RECEIVE,
        referenceType: 'RECEIVING_ORDER',
        referenceId: order.orderNumber,
        notes: `Receiving order ${order.orderNumber} - Line ${dto.lineId}`,
        userId,
      });
    }

    return updatedLine;
  }
  async assignUser(id: number, userId: number) {
    const order = await this.findOne(id);

    // Validate user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.repository.assignUser(id, userId);
  }

  async completeReceiving(id: number, receivedBy: number) {
    const order = await this.findOne(id);

    if (order.status !== 'in_progress') {
      throw new BadRequestException('Order must be in progress to complete');
    }

    // Validate that all lines have been processed (received or partial)
    const pendingLines = order.lines?.filter((line) => line.status === 'pending') || [];
    if (pendingLines.length > 0) {
      throw new BadRequestException(
        `Cannot complete order: ${pendingLines.length} line(s) still pending`
      );
    }

    return this.repository.completeReceiving(id, receivedBy);
  }

  async generatePurchaseOrderNumber(): Promise<{ suggest: string }> {
    const number = await this.repository.generatePurchaseOrderNumber();
    return { suggest: number };
  }

  async cancel(id: number) {
    const order = await this.findOne(id);

    if (order.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed orders');
    }

    if (order.status === 'in_progress') {
      // Check if any lines have been received
      const receivedLines = order.lines?.filter((line) => line.receivedQuantity > 0) || [];
      if (receivedLines.length > 0) {
        throw new BadRequestException(
          'Cannot cancel order: some lines have already been received. Please complete or adjust the order instead.'
        );
      }
    }

    return this.repository.cancel(id);
  }

  async getDamagedItems(query: QueryDamagedItemsDto): Promise<DamagedItem[]> {
    const items = await this.repository.getDamagedItems(query);

    return items.map((item) => ({
      id: item.id,
      receivingOrderNumber: item.receivingOrder.orderNumber,
      productCode: item.product.code,
      productName: item.product.name,
      damageQuantity: item.damageQuantity,
      receivedDate: item.receivedAt,
      locationName: item.location?.name,
      notes: item.notes,
    }));
  }
}
