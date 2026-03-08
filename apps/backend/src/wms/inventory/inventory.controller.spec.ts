import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import {
  ReserveInventoryDto,
  ReleaseReservationDto,
  CreateAdjustmentDto,
  AdjustmentReason,
} from './dto';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: jest.Mocked<InventoryService>;

  const mockInventory = {
    id: 'inv-001',
    productId: 'prod-001',
    levelId: 'level-001',
    warehouseId: 'wh-001',
    quantity: 100,
    availableQuantity: 80,
    reservedQuantity: 20,
    status: 'available',
    updatedAt: new Date(),
  };

  const mockAdjustment = {
    id: 'adj-001',
    adjustmentNumber: 'ADJ-2026-0001',
    warehouseId: 'wh-001',
    reason: AdjustmentReason.PHYSICAL_COUNT,
    status: 'draft',
    lines: [],
    createdAt: new Date(),
  };

  const mockService = {
    getInventory: jest.fn(),
    getAvailableStock: jest.fn(),
    getStockByProduct: jest.fn(),
    getStockByLocation: jest.fn(),
    updateInventory: jest.fn(),
    reserveInventory: jest.fn(),
    releaseReservation: jest.fn(),
    createTransaction: jest.fn(),
    getTransactionHistory: jest.fn(),
    createAdjustment: jest.fn(),
    getAdjustments: jest.fn(),
    getAdjustment: jest.fn(),
    approveAdjustment: jest.fn(),
    cancelAdjustment: jest.fn(),
  };

  const mockReq = { user: { id: 'user-001' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return inventory list', async () => {
      service.getInventory.mockResolvedValue([mockInventory]);

      const result = await controller.getInventory({});

      expect(service.getInventory).toHaveBeenCalledWith({});
      expect(result).toEqual([mockInventory]);
    });
  });

  describe('getAvailableStock', () => {
    it('should return available stock for a product', async () => {
      service.getAvailableStock.mockResolvedValue(80);

      const result = await controller.getAvailableStock('prod-001', 'wh-001');

      expect(service.getAvailableStock).toHaveBeenCalledWith('prod-001', 'wh-001');
      expect(result).toBe(80);
    });
  });

  describe('getStockByProduct', () => {
    it('should return stock by product', async () => {
      service.getStockByProduct.mockResolvedValue([mockInventory]);

      const result = await controller.getStockByProduct('prod-001');

      expect(service.getStockByProduct).toHaveBeenCalledWith('prod-001');
      expect(result).toEqual([mockInventory]);
    });
  });

  describe('getStockByLocation', () => {
    it('should return stock by location', async () => {
      service.getStockByLocation.mockResolvedValue([mockInventory]);

      const result = await controller.getStockByLocation('level-001');

      expect(service.getStockByLocation).toHaveBeenCalledWith('level-001');
      expect(result).toEqual([mockInventory]);
    });
  });

  describe('reserveInventory', () => {
    it('should call service to reserve inventory', async () => {
      const dto: ReserveInventoryDto = {
        productId: 'prod-001',
        quantity: 10,
        referenceType: 'SALES_ORDER',
        referenceId: 'so-001',
      };

      service.reserveInventory.mockResolvedValue(undefined);

      await controller.reserveInventory(dto);

      expect(service.reserveInventory).toHaveBeenCalledWith(dto);
    });
  });

  describe('releaseReservation', () => {
    it('should call service to release reservation', async () => {
      const dto: ReleaseReservationDto = {
        productId: 'prod-001',
        quantity: 10,
        referenceId: 'so-001',
      };

      service.releaseReservation.mockResolvedValue(undefined);

      await controller.releaseReservation(dto);

      expect(service.releaseReservation).toHaveBeenCalledWith(dto);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with parsed dates', async () => {
      service.getTransactionHistory.mockResolvedValue([]);

      const result = await controller.getTransactionHistory(
        'prod-001',
        'wh-001',
        '2026-01-01',
        '2026-12-31',
        '50'
      );

      expect(service.getTransactionHistory).toHaveBeenCalledWith({
        productId: 'prod-001',
        warehouseId: 'wh-001',
        fromDate: new Date('2026-01-01'),
        toDate: new Date('2026-12-31'),
        limit: 50,
      });
      expect(result).toEqual([]);
    });
  });

  describe('createAdjustment', () => {
    it('should create an adjustment with user id', async () => {
      const dto: CreateAdjustmentDto = {
        warehouseId: 'wh-001',
        reason: AdjustmentReason.PHYSICAL_COUNT,
        lines: [],
      };

      service.createAdjustment.mockResolvedValue(mockAdjustment as any);

      const result = await controller.createAdjustment(dto, mockReq);

      expect(service.createAdjustment).toHaveBeenCalledWith(dto, 'user-001');
      expect(result).toEqual(mockAdjustment);
    });
  });

  describe('getAdjustments', () => {
    it('should return all adjustments', async () => {
      service.getAdjustments.mockResolvedValue([mockAdjustment as any]);

      const result = await controller.getAdjustments('wh-001', 'draft');

      expect(service.getAdjustments).toHaveBeenCalledWith('wh-001', 'draft');
      expect(result).toEqual([mockAdjustment]);
    });
  });

  describe('approveAdjustment', () => {
    it('should approve adjustment with user id', async () => {
      service.approveAdjustment.mockResolvedValue({ ...mockAdjustment, status: 'approved' } as any);

      const result = await controller.approveAdjustment('adj-001', mockReq);

      expect(service.approveAdjustment).toHaveBeenCalledWith('adj-001', 'user-001');
      expect(result.status).toBe('approved');
    });
  });

  describe('cancelAdjustment', () => {
    it('should cancel an adjustment', async () => {
      service.cancelAdjustment.mockResolvedValue({ ...mockAdjustment, status: 'cancelled' } as any);

      await controller.cancelAdjustment('adj-001');

      expect(service.cancelAdjustment).toHaveBeenCalledWith('adj-001');
    });
  });
});
