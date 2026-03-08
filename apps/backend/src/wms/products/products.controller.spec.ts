import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

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
  };

  const mockProductsResponse = {
    items: [mockProduct],
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
    update: jest.fn(),
    remove: jest.fn(),
    addBarcode: jest.fn(),
    removeBarcode: jest.fn(),
    getLowStockProducts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto: CreateProductDto = {
        code: 'PROD-001',
        name: 'Test Product',
        uom: 'PZA',
        barcode: mockBarcode,
      };

      service.create.mockResolvedValue(mockProduct as any);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query: QueryProductDto = {
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockProductsResponse as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockProductsResponse);
    });

    it('should apply search filter', async () => {
      const query: QueryProductDto = {
        search: 'laptop',
        page: 1,
        limit: 20,
      };

      service.findAll.mockResolvedValue(mockProductsResponse as any);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      service.findOne.mockResolvedValue(mockProduct as any);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findByBarcode', () => {
    it('should return a product by barcode', async () => {
      const barcode = '7501234567890';
      service.findByBarcode.mockResolvedValue(mockProduct as any);

      const result = await controller.findByBarcode(barcode);

      expect(service.findByBarcode).toHaveBeenCalledWith(barcode);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
      };

      service.update.mockResolvedValue({ ...mockProduct, ...updateDto } as any);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      service.remove.mockResolvedValue(undefined as any);

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });
  });

  describe('getLowStock', () => {
    it('should return products with low stock', async () => {
      service.getLowStockProducts.mockResolvedValue([mockProduct] as any);

      const result = await controller.getLowStock();

      expect(service.getLowStockProducts).toHaveBeenCalled();
      expect(result).toEqual([mockProduct]);
    });
  });

  describe('addBarcode', () => {
    it('should add a barcode to a product', async () => {
      const barcode = {
        barcode: '7501234567890',
        type: 'EAN13',
        isPrimary: true,
      };

      const mockBarcode = {
        id: 1,
        productId: 1,
        ...barcode,
        createdAt: new Date(),
      };

      service.addBarcode.mockResolvedValue(mockBarcode as any);

      const result = await controller.addBarcode(1, barcode);

      expect(service.addBarcode).toHaveBeenCalledWith(
        1,
        barcode.barcode,
        barcode.type,
        barcode.isPrimary
      );
      expect(result).toEqual(mockBarcode);
    });
  });

  describe('removeBarcode', () => {
    it('should remove a barcode from a product', async () => {
      service.removeBarcode.mockResolvedValue(undefined as any);

      const result = await controller.removeBarcode(1, 1);

      expect(service.removeBarcode).toHaveBeenCalledWith(1, 1);
      expect(result).toBeUndefined();
    });
  });
});
