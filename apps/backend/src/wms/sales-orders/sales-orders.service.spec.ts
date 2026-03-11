import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersRepository } from './sales-orders.repository';
import { InventoryService } from '../inventory/inventory.service';
import { ValidateStockDto } from './dto';

describe('SalesOrdersService', () => {
  let service: SalesOrdersService;
  let repository: jest.Mocked<SalesOrdersRepository>;
  let inventoryService: jest.Mocked<InventoryService>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockWarehouse = {
    id: 1,
    code: 'WH-001',
    name: 'Almacén Principal',
    isActive: true,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockProduct = {
    id: 1,
    code: 'PROD-001',
    name: 'Producto Test',
    isActive: true,
    uom: 'PZA',
    description: null,
    category: null,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    weight: 0,
    width: null,
    height: null,
    depth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockOrder = {
    id: 1,
    orderNumber: 'SO-2026-0001',
    warehouseId: 1,
    customerName: 'Cliente Test',
    customerCode: 'CLI-001',
    customerPhone: null,
    customerEmail: null,
    shippingAddress: null,
    shippingCity: null,
    shippingState: null,
    shippingZipCode: null,
    orderDate: new Date(),
    requiredDate: null,
    shippedDate: null,
    priority: 'normal',
    status: 'pending',
    totalAmount: 1000,
    notes: null,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lines: [
      {
        id: 1,
        salesOrderId: 1,
        productId: 1,
        orderedQuantity: 10,
        pickedQuantity: 0,
        shippedQuantity: 0,
        unitPrice: 100,
        subtotal: 1000,
        status: 'pending',
        notes: null,
        product: { id: 1, code: 'PROD-001', name: 'Producto Test', uom: 'PZA' },
      },
    ],
    warehouse: { id: 1, code: 'WH-001', name: 'Almacén Principal' },
    createdUser: null,
  } as unknown as any;

  const mockRepository = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByOrderNumber: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePriority: jest.fn(),
    updateStatus: jest.fn(),
    updateLineStatus: jest.fn(),
    cancel: jest.fn(),
    getPrimaryWarehouse: jest.fn(),
    getProductById: jest.fn(),
  };

  const mockInventoryService = {
    getAvailableStock: jest.fn(),
    reserveInventory: jest.fn(),
    releaseReservation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrdersService,
        { provide: SalesOrdersRepository, useValue: mockRepository },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<SalesOrdersService>(SalesOrdersService);
    repository = module.get(SalesOrdersRepository);
    inventoryService = module.get(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return an order by id', async () => {
      repository.findOne.mockResolvedValue(mockOrder as never);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      repository.findOne.mockResolvedValue(null as never);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── validateStock ─────────────────────────────────────────────────────────

  describe('validateStock', () => {
    const dto: ValidateStockDto = {
      items: [
        { productId: 1, quantity: 10 },
        { productId: 2, quantity: 5 },
      ],
    };

    it('should return valid when all items have enough stock', async () => {
      inventoryService.getAvailableStock.mockResolvedValueOnce(50).mockResolvedValueOnce(20);

      const result = await service.validateStock(dto);

      expect(result.valid).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].canFulfill).toBe(true);
      expect(result.items[1].canFulfill).toBe(true);
    });

    it('should return invalid when any item has insufficient stock', async () => {
      inventoryService.getAvailableStock.mockResolvedValueOnce(50).mockResolvedValueOnce(2); // less than requested 5

      const result = await service.validateStock(dto);

      expect(result.valid).toBe(false);
      expect(result.items[1].canFulfill).toBe(false);
      expect(result.items[1].message).toBeDefined();
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      customerName: 'Cliente Test',
      lines: [{ productId: 1, quantity: 10, unitPrice: 100 }],
    };

    it('should create order and reserve inventory when stock is sufficient', async () => {
      repository.getPrimaryWarehouse.mockResolvedValue(mockWarehouse as never);
      repository.getProductById.mockResolvedValue(mockProduct as never);
      inventoryService.getAvailableStock.mockResolvedValue(50);
      repository.create.mockResolvedValue(mockOrder as never);
      inventoryService.reserveInventory.mockResolvedValue(undefined as never);

      const result = await service.create(createDto as never, 1);

      expect(repository.create).toHaveBeenCalled();
      expect(inventoryService.reserveInventory).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 1,
          quantity: 10,
          referenceType: 'SALES_ORDER',
        })
      );
      expect(result.orderNumber).toBe('SO-2026-0001');
    });

    it('should throw NotFoundException when no active warehouse found', async () => {
      repository.getPrimaryWarehouse.mockResolvedValue(null as never);

      await expect(service.create(createDto as never, 1)).rejects.toThrow(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      repository.getPrimaryWarehouse.mockResolvedValue(mockWarehouse as never);
      repository.getProductById.mockResolvedValue(mockProduct as never);
      inventoryService.getAvailableStock.mockResolvedValue(2); // less than 10

      await expect(service.create(createDto as never, 1)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      repository.getPrimaryWarehouse.mockResolvedValue(mockWarehouse as never);
      repository.getProductById.mockResolvedValue(null as never);

      await expect(service.create(createDto as never, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when product is inactive', async () => {
      repository.getPrimaryWarehouse.mockResolvedValue(mockWarehouse as never);
      repository.getProductById.mockResolvedValue({ ...mockProduct, isActive: false } as never);

      await expect(service.create(createDto as never, 1)).rejects.toThrow(BadRequestException);
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('should cancel a pending order and release inventory', async () => {
      repository.findOne.mockResolvedValue(mockOrder as never);
      inventoryService.releaseReservation.mockResolvedValue(undefined as never);
      repository.cancel.mockResolvedValue({ ...mockOrder, status: 'cancelled' } as never);

      const result = await service.cancel(1);

      expect(inventoryService.releaseReservation).toHaveBeenCalled();
      expect(repository.cancel).toHaveBeenCalledWith(1);
      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException when order is already shipped', async () => {
      repository.findOne.mockResolvedValue({ ...mockOrder, status: 'shipped' } as never);

      await expect(service.cancel(1)).rejects.toThrow(BadRequestException);
      expect(repository.cancel).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is already cancelled', async () => {
      repository.findOne.mockResolvedValue({ ...mockOrder, status: 'cancelled' } as never);

      await expect(service.cancel(1)).rejects.toThrow(BadRequestException);
      expect(repository.cancel).not.toHaveBeenCalled();
    });
  });

  // ── updatePriority ────────────────────────────────────────────────────────

  describe('updatePriority', () => {
    it('should update priority for a pending order', async () => {
      repository.findOne.mockResolvedValue(mockOrder as never);
      repository.updatePriority.mockResolvedValue({ ...mockOrder, priority: 'urgent' } as never);

      const result = await service.updatePriority(1, 'urgent');

      expect(repository.updatePriority).toHaveBeenCalledWith(1, 'urgent');
      expect(result.priority).toBe('urgent');
    });

    it('should throw BadRequestException for shipped orders', async () => {
      repository.findOne.mockResolvedValue({ ...mockOrder, status: 'shipped' } as never);

      await expect(service.updatePriority(1, 'urgent')).rejects.toThrow(BadRequestException);
    });
  });

  // ── canPick ───────────────────────────────────────────────────────────────

  describe('canPick', () => {
    it('should return canPick = true for pending orders', async () => {
      repository.findOne.mockResolvedValue(mockOrder as never);

      const result = await service.canPick(1);

      expect(result.canPick).toBe(true);
    });

    it('should return canPick = false for non-pending orders', async () => {
      repository.findOne.mockResolvedValue({ ...mockOrder, status: 'picking' } as never);

      const result = await service.canPick(1);

      expect(result.canPick).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});
