import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import { PrismaService } from '../../app/prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';

describe('LocationsService', () => {
  let service: LocationsService;
  let repository: jest.Mocked<LocationsRepository>;
  let prisma: jest.Mocked<PrismaService>;

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

  const mockLocation = {
    id: 1,
    warehouseId: 1,
    zone: 'A',
    row: '01',
    position: '01',
    level: '1',
    barcode: 'LOC-A-01-01-1',
    name: 'A-01-01-1',
    fullPath: 'WH-001/A/01/01/1',
    type: 'storage' as const,
    sequence: 0,
    height: 2.5,
    capacity: 100,
    maxWeight: 500,
    allowMixedProducts: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    warehouse: {
      id: 1,
      code: 'WH-001',
      name: 'Main Warehouse',
      address: '123 Main St',
      city: 'Mexico City',
      state: 'CDMX',
    },
    _count: {
      inventories: 0,
    },
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByBarcode: jest.fn(),
    findByWarehouse: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPrisma = {
    warehouse: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: LocationsRepository,
          useValue: mockRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    repository = module.get(LocationsRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a location successfully', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 1,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 100,
      };

      repository.findByBarcode.mockResolvedValue(null);
      mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse);
      repository.create.mockResolvedValue(mockLocation);

      const result = await service.create(createDto);

      expect(repository.findByBarcode).toHaveBeenCalledWith('LOC-A-01-01-1');
      expect(mockPrisma.warehouse.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLocation);
    });

    it('should throw BadRequestException if barcode already exists', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 1,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 100,
      };

      repository.findByBarcode.mockResolvedValue(mockLocation);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Location with barcode LOC-A-01-01-1 already exists'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if warehouse does not exist', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 999,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 100,
      };

      repository.findByBarcode.mockResolvedValue(null);
      mockPrisma.warehouse.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('Warehouse with ID 999 not found');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if warehouse is inactive', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 1,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 100,
      };

      repository.findByBarcode.mockResolvedValue(null);
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        ...mockWarehouse,
        isActive: false,
      });

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow(
        'Cannot create location in inactive warehouse'
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if capacity is invalid', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 1,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 0,
      };

      repository.findByBarcode.mockResolvedValue(null);
      mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('Capacity must be greater than 0');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if maxWeight is negative', async () => {
      const createDto: CreateLocationDto = {
        warehouseId: 1,
        zone: 'A',
        row: '01',
        position: '01',
        level: '1',
        barcode: 'LOC-A-01-01-1',
        name: 'A-01-01-1',
        type: 'storage',
        capacity: 100,
        maxWeight: -10,
      };

      repository.findByBarcode.mockResolvedValue(null);
      mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('Max weight cannot be negative');
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated locations', async () => {
      const query: QueryLocationDto = {
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockLocation],
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

    it('should filter by warehouseId', async () => {
      const query: QueryLocationDto = {
        warehouseId: 1,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockLocation],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by zone', async () => {
      const query: QueryLocationDto = {
        zone: 'A',
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockLocation],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.findAll.mockResolvedValue(mockResponse);

      await service.findAll(query);

      expect(repository.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by availableOnly', async () => {
      const query: QueryLocationDto = {
        availableOnly: true,
        page: 1,
        limit: 20,
      };

      const mockResponse = {
        items: [mockLocation],
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
    it('should return a location by id', async () => {
      repository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if location not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Location with ID 999 not found');
    });
  });

  describe('findByBarcode', () => {
    it('should return a location by barcode', async () => {
      repository.findByBarcode.mockResolvedValue(mockLocation);

      const result = await service.findByBarcode('LOC-A-01-01-1');

      expect(repository.findByBarcode).toHaveBeenCalledWith('LOC-A-01-01-1');
      expect(result).toEqual(mockLocation);
    });

    it('should throw NotFoundException if barcode not found', async () => {
      repository.findByBarcode.mockResolvedValue(null);

      await expect(service.findByBarcode('INVALID')).rejects.toThrow(NotFoundException);
      await expect(service.findByBarcode('INVALID')).rejects.toThrow(
        'Location with barcode INVALID not found'
      );
    });
  });

  describe('findByWarehouseTree', () => {
    it('should return hierarchical tree structure', async () => {
      const mockTree = [
        {
          zone: 'A',
          rows: [
            {
              row: '01',
              positions: [
                {
                  position: '01',
                  levels: [mockLocation],
                },
              ],
            },
          ],
        },
      ];

      mockPrisma.warehouse.findUnique.mockResolvedValue(mockWarehouse);
      repository.findByWarehouse.mockResolvedValue(mockTree);

      const result = await service.findByWarehouseTree(1);

      expect(mockPrisma.warehouse.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(repository.findByWarehouse).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTree);
    });

    it('should throw NotFoundException if warehouse not found', async () => {
      mockPrisma.warehouse.findUnique.mockResolvedValue(null);

      await expect(service.findByWarehouseTree(999)).rejects.toThrow(NotFoundException);
      await expect(service.findByWarehouseTree(999)).rejects.toThrow(
        'Warehouse with ID 999 not found'
      );
      expect(repository.findByWarehouse).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a location successfully', async () => {
      const updateDto: UpdateLocationDto = {
        name: 'Updated Location',
      };

      repository.findOne.mockResolvedValue(mockLocation);
      repository.update.mockResolvedValue({ ...mockLocation, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Location');
    });

    it('should throw NotFoundException if location does not exist', async () => {
      const updateDto: UpdateLocationDto = {
        name: 'Updated Location',
      };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if updating barcode to duplicate', async () => {
      const updateDto: UpdateLocationDto = {
        barcode: 'LOC-A-01-01-2',
      };

      const otherLocation = { ...mockLocation, id: 2, barcode: 'LOC-A-01-01-2' };

      repository.findOne.mockResolvedValue(mockLocation);
      repository.findByBarcode.mockResolvedValue(otherLocation);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Location with barcode LOC-A-01-01-2 already exists'
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should allow updating location with same barcode', async () => {
      const updateDto: UpdateLocationDto = {
        barcode: 'LOC-A-01-01-1',
        name: 'Updated Name',
      };

      repository.findOne.mockResolvedValue(mockLocation);
      repository.findByBarcode.mockResolvedValue(mockLocation);
      repository.update.mockResolvedValue({ ...mockLocation, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Name');
    });

    it('should throw BadRequestException if capacity is invalid', async () => {
      const updateDto: UpdateLocationDto = {
        capacity: 0,
      };

      repository.findOne.mockResolvedValue(mockLocation);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow('Capacity must be greater than 0');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if maxWeight is negative', async () => {
      const updateDto: UpdateLocationDto = {
        maxWeight: -10,
      };

      repository.findOne.mockResolvedValue(mockLocation);

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow('Max weight cannot be negative');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if changing to non-existent warehouse', async () => {
      const updateDto: UpdateLocationDto = {
        warehouseId: 999,
      };

      repository.findOne.mockResolvedValue(mockLocation);
      mockPrisma.warehouse.findUnique.mockResolvedValue(null);

      await expect(service.update(1, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(1, updateDto)).rejects.toThrow('Warehouse with ID 999 not found');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if changing to inactive warehouse', async () => {
      const updateDto: UpdateLocationDto = {
        warehouseId: 2,
      };

      repository.findOne.mockResolvedValue(mockLocation);
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        ...mockWarehouse,
        id: 2,
        isActive: false,
      });

      await expect(service.update(1, updateDto)).rejects.toThrow(BadRequestException);
      await expect(service.update(1, updateDto)).rejects.toThrow(
        'Cannot move location to inactive warehouse'
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should regenerate fullPath when zone changes', async () => {
      const updateDto: UpdateLocationDto = {
        zone: 'B',
      };

      repository.findOne.mockResolvedValue(mockLocation);
      repository.update.mockResolvedValue({
        ...mockLocation,
        zone: 'B',
        fullPath: 'WH-001/B/01/01/1',
      });

      const result = await service.update(1, updateDto);

      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.zone).toBe('B');
    });
  });

  describe('remove', () => {
    it('should soft delete a location without inventory', async () => {
      repository.findOne.mockResolvedValue(mockLocation);
      repository.remove.mockResolvedValue({ ...mockLocation, isActive: false });

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });

    it('should throw BadRequestException when deleting location with inventory', async () => {
      const locationWithInventory = {
        ...mockLocation,
        _count: {
          inventories: 5,
        },
      };

      repository.findOne.mockResolvedValue(locationWithInventory);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow(
        'Cannot delete location with existing inventory (5 items)'
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if location does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
