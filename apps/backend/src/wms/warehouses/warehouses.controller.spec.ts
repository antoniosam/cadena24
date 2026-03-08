import { Test, TestingModule } from '@nestjs/testing';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';

describe('WarehousesController', () => {
  let controller: WarehousesController;
  let service: jest.Mocked<WarehousesService>;

  const mockWarehouse = {
    id: 1,
    code: 'WH-001',
    name: 'Main Warehouse',
    address: '123 Main St',
    city: 'Mexico City',
    state: 'CDMX',
    zipCode: '01000',
    isPrimary: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWarehousesResponse = {
    items: [mockWarehouse],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findPrimary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [
        {
          provide: WarehousesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WarehousesController>(WarehousesController);
    service = module.get(WarehousesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a warehouse', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-001',
        name: 'Main Warehouse',
      };

      service.create.mockResolvedValue(mockWarehouse as any);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockWarehouse);
    });

    it('should validate required fields', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-001',
        name: 'Main Warehouse',
        isPrimary: true,
      };

      service.create.mockResolvedValue(mockWarehouse as any);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.code).toBe('WH-001');
      expect(result.isPrimary).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated warehouses', async () => {
      const query: QueryWarehouseDto = {
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockWarehousesResponse as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockWarehousesResponse);
    });

    it('should apply search filter', async () => {
      const query: QueryWarehouseDto = {
        search: 'Main',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockWarehousesResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by isActive', async () => {
      const query: QueryWarehouseDto = {
        isActive: true,
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockWarehousesResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by isPrimary', async () => {
      const query: QueryWarehouseDto = {
        isPrimary: true,
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockWarehousesResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findPrimary', () => {
    it('should return the primary warehouse', async () => {
      service.findPrimary.mockResolvedValue(mockWarehouse as any);

      const result = await controller.findPrimary();

      expect(service.findPrimary).toHaveBeenCalled();
      expect(result).toEqual(mockWarehouse);
      expect(result.isPrimary).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by id', async () => {
      service.findOne.mockResolvedValue(mockWarehouse as any);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWarehouse);
    });
  });

  describe('update', () => {
    it('should update a warehouse', async () => {
      const updateDto: UpdateWarehouseDto = {
        name: 'Updated Warehouse',
      };

      service.update.mockResolvedValue({ ...mockWarehouse, ...updateDto } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Warehouse');
    });

    it('should update warehouse code', async () => {
      const updateDto: UpdateWarehouseDto = {
        code: 'WH-002',
      };

      service.update.mockResolvedValue({ ...mockWarehouse, code: 'WH-002' } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.code).toBe('WH-002');
    });

    it('should update isPrimary status', async () => {
      const updateDto: UpdateWarehouseDto = {
        isPrimary: true,
      };

      service.update.mockResolvedValue({ ...mockWarehouse, isPrimary: true } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.isPrimary).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a warehouse', async () => {
      service.remove.mockResolvedValue({ ...mockWarehouse, isActive: false } as any);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });
  });
});
