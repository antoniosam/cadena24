import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import {
  ReserveInventoryDto,
  ReleaseReservationDto,
  CreateAdjustmentDto,
  AdjustmentReason,
  TransactionType,
} from './dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<InventoryRepository>;

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
    warehouseId_result: 'wh-001',
  };

  const mockAdjustment = {
    id: 'adj-001',
    adjustmentNumber: 'ADJ-2026-0001',
    warehouseId: 'wh-001',
    reason: AdjustmentReason.PHYSICAL_COUNT,
    status: 'draft',
    notes: null,
    createdBy: 'user-001',
    approvedBy: null,
    createdAt: new Date(),
    approvedAt: null,
    lines: [
      {
        id: 'line-001',
        adjustmentId: 'adj-001',
        productId: 'prod-001',
        levelId: 'level-001',
        systemQuantity: 100,
        physicalQuantity: 95,
        difference: -5,
      },
    ],
  };

  const mockRepository = {
    findInventory: jest.fn(),
    findInventoryByProductAndLevel: jest.fn(),
    getAvailableStock: jest.fn(),
    getStockByProduct: jest.fn(),
    getStockByLocation: jest.fn(),
    createOrUpdateInventory: jest.fn(),
    reserveInventory: jest.fn(),
    releaseReservation: jest.fn(),
    createTransaction: jest.fn(),
    getTransactionHistory: jest.fn(),
    createAdjustment: jest.fn(),
    getAdjustments: jest.fn(),
    getAdjustment: jest.fn(),
    approveAdjustment: jest.fn(),
    cancelAdjustment: jest.fn(),
    getWarehouseIdFromLevel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get(InventoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return inventory list', async () => {
      repository.findInventory.mockResolvedValue([mockInventory]);

      const result = await service.getInventory({});

      expect(repository.findInventory).toHaveBeenCalledWith({});
      expect(result).toEqual([mockInventory]);
    });
  });

  describe('getAvailableStock', () => {
    it('should return available stock for a product', async () => {
      repository.getAvailableStock.mockResolvedValue(80);

      const result = await service.getAvailableStock('prod-001');

      expect(repository.getAvailableStock).toHaveBeenCalledWith('prod-001', undefined);
      expect(result).toBe(80);
    });

    it('should filter by warehouse when provided', async () => {
      repository.getAvailableStock.mockResolvedValue(50);

      const result = await service.getAvailableStock('prod-001', 'wh-001');

      expect(repository.getAvailableStock).toHaveBeenCalledWith('prod-001', 'wh-001');
      expect(result).toBe(50);
    });
  });

  describe('reserveInventory', () => {
    const reserveDto: ReserveInventoryDto = {
      productId: 'prod-001',
      quantity: 10,
      referenceType: 'SALES_ORDER',
      referenceId: 'so-001',
    };

    it('should reserve inventory when stock is sufficient', async () => {
      repository.getAvailableStock.mockResolvedValue(80);
      repository.reserveInventory.mockResolvedValue(undefined);

      await service.reserveInventory(reserveDto);

      expect(repository.getAvailableStock).toHaveBeenCalledWith('prod-001');
      expect(repository.reserveInventory).toHaveBeenCalledWith('prod-001', 10, 'so-001');
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      repository.getAvailableStock.mockResolvedValue(5);

      await expect(service.reserveInventory(reserveDto)).rejects.toThrow(BadRequestException);
      expect(repository.reserveInventory).not.toHaveBeenCalled();
    });
  });

  describe('releaseReservation', () => {
    it('should release reservation successfully', async () => {
      const releaseDto: ReleaseReservationDto = {
        productId: 'prod-001',
        quantity: 10,
        referenceId: 'so-001',
      };

      repository.releaseReservation.mockResolvedValue(undefined);

      await service.releaseReservation(releaseDto);

      expect(repository.releaseReservation).toHaveBeenCalledWith('prod-001', 10, 'so-001');
    });
  });

  describe('getAdjustment', () => {
    it('should return an adjustment by id', async () => {
      repository.getAdjustment.mockResolvedValue(mockAdjustment);

      const result = await service.getAdjustment('adj-001');

      expect(repository.getAdjustment).toHaveBeenCalledWith('adj-001');
      expect(result).toEqual(mockAdjustment);
    });

    it('should throw NotFoundException when adjustment not found', async () => {
      repository.getAdjustment.mockResolvedValue(null);

      await expect(service.getAdjustment('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAdjustment', () => {
    const createDto: CreateAdjustmentDto = {
      warehouseId: 'wh-001',
      reason: AdjustmentReason.PHYSICAL_COUNT,
      lines: [
        {
          productId: 'prod-001',
          levelId: 'level-001',
          systemQuantity: 100,
          physicalQuantity: 95,
        },
      ],
    };

    it('should create adjustment when quantities match', async () => {
      repository.findInventoryByProductAndLevel.mockResolvedValue({
        ...mockInventory,
        quantity: 100,
      });
      repository.createAdjustment.mockResolvedValue(mockAdjustment);

      const result = await service.createAdjustment(createDto, 'user-001');

      expect(repository.createAdjustment).toHaveBeenCalledWith(createDto, 'user-001');
      expect(result).toEqual(mockAdjustment);
    });

    it('should throw BadRequestException when system quantities mismatch', async () => {
      repository.findInventoryByProductAndLevel.mockResolvedValue({
        ...mockInventory,
        quantity: 90, // different from systemQuantity: 100
      });

      await expect(service.createAdjustment(createDto, 'user-001')).rejects.toThrow(
        BadRequestException
      );
      expect(repository.createAdjustment).not.toHaveBeenCalled();
    });
  });

  describe('approveAdjustment', () => {
    it('should approve a draft adjustment and apply inventory changes', async () => {
      const approvedAdjustment = { ...mockAdjustment, status: 'approved' };

      repository.getAdjustment.mockResolvedValue(mockAdjustment);
      repository.approveAdjustment.mockResolvedValue(approvedAdjustment);
      repository.createOrUpdateInventory.mockResolvedValue(mockInventory);
      repository.createTransaction.mockResolvedValue({});

      const result = await service.approveAdjustment('adj-001', 'user-001');

      expect(repository.approveAdjustment).toHaveBeenCalledWith('adj-001', 'user-001');
      expect(repository.createOrUpdateInventory).toHaveBeenCalled();
      expect(repository.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: TransactionType.ADJUST,
          referenceType: 'ADJUSTMENT',
        })
      );
      expect(result).toEqual(approvedAdjustment);
    });

    it('should throw BadRequestException for non-draft adjustments', async () => {
      repository.getAdjustment.mockResolvedValue({ ...mockAdjustment, status: 'approved' });

      await expect(service.approveAdjustment('adj-001', 'user-001')).rejects.toThrow(
        BadRequestException
      );
      expect(repository.approveAdjustment).not.toHaveBeenCalled();
    });
  });

  describe('cancelAdjustment', () => {
    it('should cancel a draft adjustment', async () => {
      repository.getAdjustment.mockResolvedValue(mockAdjustment);
      repository.cancelAdjustment.mockResolvedValue({ ...mockAdjustment, status: 'cancelled' });

      const result = await service.cancelAdjustment('adj-001');

      expect(repository.cancelAdjustment).toHaveBeenCalledWith('adj-001');
      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException for non-draft adjustments', async () => {
      repository.getAdjustment.mockResolvedValue({ ...mockAdjustment, status: 'approved' });

      await expect(service.cancelAdjustment('adj-001')).rejects.toThrow(BadRequestException);
      expect(repository.cancelAdjustment).not.toHaveBeenCalled();
    });
  });
});
