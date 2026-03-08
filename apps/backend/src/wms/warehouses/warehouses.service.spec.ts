import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesRepository } from './warehouses.repository';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { QueryWarehouseDto } from './dto/query-warehouse.dto';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let repository: jest.Mocked<WarehousesRepository>;

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
    _count: {
      locations: 0,
      inventories: 0,
    },
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    findPrimary: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: WarehousesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
    repository = module.get(WarehousesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a warehouse successfully', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-001',
        name: 'Main Warehouse',
        address: '123 Main St',
        city: 'Mexico City',
        state: 'CDMX',
        isPrimary: false,
        isActive: true,
      };

      repository.findByCode.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockWarehouse);

      const result = await service.create(createDto);

      expect(repository.findByCode).toHaveBeenCalledWith('WH-001');
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockWarehouse);
    });

    it('should throw BadRequestException if code already exists', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-001',
        name: 'Main Warehouse',
      };

      repository.findByCode.mockResolvedValue(mockWarehouse);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Warehouse with code WH-001 already exists'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if another warehouse is already primary', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-002',
        name: 'Secondary Warehouse',
        isPrimary: true,
      };

      repository.findByCode.mockResolvedValue(null);
      repository.findPrimary.mockResolvedValue(mockWarehouse);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Warehouse WH-001 is already set as primary'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should create primary warehouse if no primary exists', async () => {
      const createDto: CreateWarehouseDto = {
        code: 'WH-001',
        name: 'Main Warehouse',
        isPrimary: true,
      };

      repository.findByCode.mockResolvedValue(null);
      repository.findPrimary.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockWarehouse);

      const result = await service.create(createDto);

      expect(repository.findPrimary).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockWarehouse);
    });
  });

  describe('findAll', () => {
    it('should return paginated warehouses', async () => {
      const query: QueryWarehouseDto = {
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockWarehouse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      const result = await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });

    it('should apply search filter', async () => {
      const query: QueryWarehouseDto = {
        search: 'Main',
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockWarehouse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      const result = await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
      expect(result.items).toHaveLength(1);
    });

    it('should filter by isActive', async () => {
      const query: QueryWarehouseDto = {
        isActive: true,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockWarehouse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by isPrimary', async () => {
      const query: QueryWarehouseDto = {
        isPrimary: true,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockWarehouse],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by id', async () => {
      repository.findOne.mockResolvedValue(mockWarehouse);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWarehouse);
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Warehouse with ID 999 not found');
    });
  });

  describe('findPrimary', () => {
    it('should return the primary warehouse', async () => {
      repository.findPrimary.mockResolvedValue(mockWarehouse);

      const result = await service.findPrimary();

      expect(repository.findPrimary).toHaveBeenCalled();
      expect(result).toEqual(mockWarehouse);
      expect(result.isPrimary).toBe(true);
    });

    it('should throw NotFoundException if no primary warehouse exists', async () => {
      repository.findPrimary.mockResolvedValue(null);

      await expect(service.findPrimary()).rejects.toThrow(NotFoundException);
      await expect(service.findPrimary()).rejects.toThrow('No primary warehouse found');
    });
  });

  describe('update', () => {
    it('should update a warehouse successfully', async () => {
      const updateDto: UpdateWarehouseDto = {
        name: 'Updated Warehouse',
      };

      repository.findOne.mockResolvedValue(mockWarehouse);
      repository.update.mockResolvedValue({ ...mockWarehouse, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Warehouse');
    });

    it('should throw NotFoundException if warehouse does not exist', async () => {
      const updateDto: UpdateWarehouseDto = {
        name: 'Updated Warehouse',
      };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if updating code to duplicate', async () => {
      const updateDto: UpdateWarehouseDto = {
        code: 'WH-002',
      };

      const otherWarehouse = { ...mockWarehouse, id: 2, code: 'WH-002' };

      repository.findOne.mockResolvedValue(mockWarehouse);
      repository.findByCode.mockResolvedValue(otherWarehouse);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Warehouse with code WH-002 already exists'
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow updating warehouse with same code', async () => {
      const updateDto: UpdateWarehouseDto = {
        code: 'WH-001',
        name: 'Updated Name',
      };

      repository.findOne.mockResolvedValue(mockWarehouse);
      repository.findByCode.mockResolvedValue(mockWarehouse);
      repository.update.mockResolvedValue({ ...mockWarehouse, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Name');
    });

    it('should handle switching primary warehouse', async () => {
      const updateDto: UpdateWarehouseDto = {
        isPrimary: true,
      };

      const nonPrimaryWarehouse = { ...mockWarehouse, isPrimary: false };

      repository.findOne.mockResolvedValue(nonPrimaryWarehouse);
      repository.update.mockResolvedValue({ ...nonPrimaryWarehouse, isPrimary: true });

      const result = await service.update(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.isPrimary).toBe(true);
    });
  });

  describe('remove', () => {
    it('should soft delete a non-primary warehouse', async () => {
      const nonPrimaryWarehouse = { ...mockWarehouse, isPrimary: false };

      repository.findOne.mockResolvedValue(nonPrimaryWarehouse);
      repository.remove.mockResolvedValue({ ...nonPrimaryWarehouse, isActive: false });

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });

    it('should throw BadRequestException when deleting primary warehouse', async () => {
      repository.findOne.mockResolvedValue(mockWarehouse);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow('Cannot delete primary warehouse');
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if warehouse does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
