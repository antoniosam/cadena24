import { Test, TestingModule } from '@nestjs/testing';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto, SalesOrderPriority, UpdateSalesOrderPriorityDto } from './dto';

describe('SalesOrdersController', () => {
  let controller: SalesOrdersController;
  let service: jest.Mocked<SalesOrdersService>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockOrder = {
    id: 1,
    orderNumber: 'SO-2026-0001',
    customerName: 'Cliente Test',
    status: 'pending',
    priority: 'normal',
    totalAmount: 1000,
    lines: [],
  } as unknown as any;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updatePriority: jest.fn(),
    validateStock: jest.fn(),
    canPick: jest.fn(),
    reserveInventory: jest.fn(),
    releaseInventory: jest.fn(),
    cancel: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockReq = { user: { sub: 1 } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesOrdersController],
      providers: [{ provide: SalesOrdersService, useValue: mockService }],
    }).compile();

    controller = module.get<SalesOrdersController>(SalesOrdersController);
    service = module.get(SalesOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a sales order', async () => {
      const dto: CreateSalesOrderDto = {
        customerName: 'Cliente Test',
        lines: [{ productId: 1, quantity: 10, unitPrice: 100 }],
      };

      service.create.mockResolvedValue(mockOrder);

      const result = await controller.create(dto, mockReq as never);

      expect(service.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return paginated sales orders', async () => {
      const mockResponse = {
        items: [mockOrder],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResponse as never);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      service.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('validateStock', () => {
    it('should validate stock for given items', async () => {
      const dto = { items: [{ productId: 1, quantity: 10 }] };
      const mockResult = {
        valid: true,
        items: [
          { productId: 1, requested: 10, available: 50, canFulfill: true, message: undefined },
        ],
      };
      service.validateStock.mockResolvedValue(mockResult);

      const result = await controller.validateStock(dto as never);

      expect(service.validateStock).toHaveBeenCalledWith(dto);
      expect(result.valid).toBe(true);
    });
  });

  describe('canPick', () => {
    it('should check if order can be picked', async () => {
      const mockCanPick = {
        canPick: true,
        orderId: 1,
        orderNumber: 'SO-2026-0001',
        status: 'pending',
        pendingLines: 2,
        reason: undefined,
      };
      service.canPick.mockResolvedValue(mockCanPick);

      const result = await controller.canPick(1);

      expect(service.canPick).toHaveBeenCalledWith(1);
      expect(result.canPick).toBe(true);
    });
  });

  describe('updatePriority', () => {
    it('should update order priority', async () => {
      const dto: UpdateSalesOrderPriorityDto = { priority: SalesOrderPriority.URGENT };
      service.updatePriority.mockResolvedValue({ ...mockOrder, priority: 'urgent' } as never);

      const result = await controller.updatePriority(1, dto);

      expect(service.updatePriority).toHaveBeenCalledWith(1, SalesOrderPriority.URGENT);
      expect(result.priority).toBe('urgent');
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      service.cancel.mockResolvedValue({ ...mockOrder, status: 'cancelled' } as never);

      const result = await controller.cancel(1);

      expect(service.cancel).toHaveBeenCalledWith(1);
      expect(result.status).toBe('cancelled');
    });
  });
});
