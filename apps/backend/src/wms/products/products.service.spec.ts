import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto } from './dto';
import * as barcodeGenerator from './utils/barcode-generator';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;

  const mockBarcode = '20260307120000';

  const mockProduct = {
    id: 1,
    code: 'PROD-001',
    name: 'Test Product',
    description: 'Test Description',
    category: 'Electronics',
    uom: 'PZA',
    minStock: 10,
    maxStock: 100,
    reorderPoint: 20,
    reorderQuantity: 50,
    weight: 1.5,
    width: 10,
    height: 5,
    depth: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    barcodes: [
      {
        id: 1,
        productId: 1,
        barcode: mockBarcode,
        type: 'CODE128',
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    inventories: [],
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCode: jest.fn(),
    findByBarcode: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addBarcode: jest.fn(),
    removeBarcode: jest.fn(),
    getLowStockProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product successfully with provided barcode', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: mockBarcode,
        minStock: 10,
        maxStock: 100,
      };

      repository.findByCode.mockResolvedValue(null as any);
      repository.findByBarcode.mockResolvedValue(null as any);
      repository.create.mockResolvedValue(mockProduct as any);

      const result = await service.create(createDto);

      expect(repository.findByCode).toHaveBeenCalledWith('PROD-001');
      expect(repository.findByBarcode).toHaveBeenCalledWith(mockBarcode);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });

    it('should auto-generate barcode if not provided', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: '', // Empty barcode
      };

      jest.spyOn(barcodeGenerator, 'generateBarcode').mockReturnValue(mockBarcode);

      repository.findByCode.mockResolvedValue(null as any);
      repository.findByBarcode.mockResolvedValue(null as any);
      repository.create.mockResolvedValue(mockProduct as any);

      await service.create(createDto);

      expect(createDto.barcode).toBe(mockBarcode);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ barcode: mockBarcode })
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: mockBarcode,
      };

      repository.findByCode.mockResolvedValue(mockProduct as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if barcode already exists', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-002',
        name: 'Test Product',
        uom: 'PZA',
        barcode: mockBarcode,
      };

      repository.findByCode.mockResolvedValue(null);
      repository.findByBarcode.mockResolvedValue(mockProduct as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if barcode is invalid', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: 'invalid€barcode', // Contains non-ASCII character
        minStock: 100,
        maxStock: 50,
      };

      repository.findByCode.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if maxStock < minStock', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: mockBarcode,
        minStock: 100,
        maxStock: 50,
      };

      repository.findByCode.mockResolvedValue(null as any);
      repository.findByBarcode.mockResolvedValue(null as any);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      repository.findOne.mockResolvedValue(mockProduct as any);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      repository.findOne.mockResolvedValue(null as any);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBarcode', () => {
    it('should return a product by barcode', async () => {
      repository.findByBarcode.mockResolvedValue(mockProduct as any);

      const result = await service.findByBarcode(mockBarcode);

      expect(repository.findByBarcode).toHaveBeenCalledWith(mockBarcode);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if barcode not found', async () => {
      repository.findByBarcode.mockResolvedValue(null as any);

      await expect(service.findByBarcode('9999999999999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.update.mockResolvedValue({ ...mockProduct, ...updateDto } as any);

      const result = await service.update(1, updateDto);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Product');
    });

    it('should update barcode successfully', async () => {
      const newBarcode = '20260307130000';
      const updateDto: UpdateProductDto = {
        barcode: newBarcode,
      };

      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.findByBarcode.mockResolvedValue(null as any);
      repository.update.mockResolvedValue({ ...mockProduct, ...updateDto } as any);

      await service.update(1, updateDto);

      expect(repository.findByBarcode).toHaveBeenCalledWith(newBarcode);
      expect(repository.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw ConflictException if barcode already exists for another product', async () => {
      const anotherProduct = { ...mockProduct, id: 2 };
      const updateDto: UpdateProductDto = {
        barcode: 'existingbarcode',
      };

      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.findByBarcode.mockResolvedValue(anotherProduct as any);

      await expect(service.update(1, updateDto)).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      repository.findOne.mockResolvedValue(null as any);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.delete.mockResolvedValue({ ...mockProduct, isActive: false } as any);

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result.isActive).toBe(false);
    });
  });

  describe('addBarcode', () => {
    it('should add a barcode to a product', async () => {
      const barcode = '7501234567890';
      const type = 'EAN13';

      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.findByBarcode.mockResolvedValue(null as any);
      repository.addBarcode.mockResolvedValue({
        id: 1,
        productId: 1,
        barcode,
        type,
        isPrimary: false,
        createdAt: new Date(),
      } as any);

      const result = await service.addBarcode(1, barcode, type);

      expect(repository.findOne).toHaveBeenCalledWith(1);
      expect(repository.addBarcode).toHaveBeenCalledWith(1, barcode, type, false);
      expect(result.barcode).toBe(barcode);
    });

    it('should throw ConflictException if barcode already exists', async () => {
      repository.findOne.mockResolvedValue(mockProduct as any);
      repository.findByBarcode.mockResolvedValue(mockProduct as any);

      await expect(service.addBarcode(1, '7501234567890', 'EAN13')).rejects.toThrow(
        ConflictException
      );
      expect(repository.addBarcode).not.toHaveBeenCalled();
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with low stock', async () => {
      const lowStockProducts = [
        { ...mockProduct, minStock: 50, inventories: [{ availableQuantity: 10 }] },
      ];

      repository.getLowStockProducts.mockResolvedValue(lowStockProducts as any);

      const result = await service.getLowStockProducts();

      expect(repository.getLowStockProducts).toHaveBeenCalled();
      expect(result).toEqual(lowStockProducts);
    });
  });
});
