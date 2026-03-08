import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: jest.Mocked<LocationsService>;

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
    },
  };

  const mockLocationsResponse = {
    items: [mockLocation],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByBarcode: jest.fn(),
    findByWarehouseTree: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get(LocationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a location', async () => {
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

      service.create.mockResolvedValue(mockLocation as any);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLocation);
    });

    it('should validate required fields', async () => {
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
        maxWeight: 500,
        allowMixedProducts: true,
      };

      service.create.mockResolvedValue(mockLocation as any);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result.zone).toBe('A');
      expect(result.type).toBe('storage');
    });
  });

  describe('findAll', () => {
    it('should return paginated locations', async () => {
      const query: QueryLocationDto = {
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockLocationsResponse);
    });

    it('should apply warehouse filter', async () => {
      const query: QueryLocationDto = {
        warehouseId: 1,
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should apply zone filter', async () => {
      const query: QueryLocationDto = {
        zone: 'A',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should apply type filter', async () => {
      const query: QueryLocationDto = {
        type: 'storage',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should apply availableOnly filter', async () => {
      const query: QueryLocationDto = {
        availableOnly: true,
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should apply search filter', async () => {
      const query: QueryLocationDto = {
        search: 'A-01',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockLocationsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findByBarcode', () => {
    it('should return a location by barcode', async () => {
      const barcode = 'LOC-A-01-01-1';
      service.findByBarcode.mockResolvedValue(mockLocation as any);

      const result = await controller.findByBarcode(barcode);

      expect(service.findByBarcode).toHaveBeenCalledWith(barcode);
      expect(result).toEqual(mockLocation);
      expect(result.barcode).toBe(barcode);
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

      service.findByWarehouseTree.mockResolvedValue(mockTree as any);

      const result = await controller.findByWarehouseTree(1);

      expect(service.findByWarehouseTree).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTree);
      expect(result[0].zone).toBe('A');
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      service.findOne.mockResolvedValue(mockLocation as any);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLocation);
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const updateDto: UpdateLocationDto = {
        name: 'Updated Location',
      };

      service.update.mockResolvedValue({ ...mockLocation, ...updateDto } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Location');
    });

    it('should update location zone', async () => {
      const updateDto: UpdateLocationDto = {
        zone: 'B',
      };

      service.update.mockResolvedValue({
        ...mockLocation,
        zone: 'B',
        fullPath: 'WH-001/B/01/01/1',
      } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.zone).toBe('B');
    });

    it('should update location capacity', async () => {
      const updateDto: UpdateLocationDto = {
        capacity: 200,
      };

      service.update.mockResolvedValue({ ...mockLocation, capacity: 200 } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.capacity).toBe(200);
    });
  });

  describe('remove', () => {
    it('should delete a location', async () => {
      service.remove.mockResolvedValue({ ...mockLocation, isActive: false } as any);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });
  });
});
