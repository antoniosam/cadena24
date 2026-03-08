import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ProductsStateService } from './products-state.service';
import { ProductsApiService } from './products-api.service';
import { Product, ProductsResponse } from '@cadena24-wms/shared';

describe('ProductsStateService', () => {
  let service: ProductsStateService;
  let apiService: jest.Mocked<ProductsApiService>;

  const mockProduct: Product = {
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
        barcode: '20260307120000',
        type: 'CODE128',
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
  };

  const mockProductsResponse: ProductsResponse = {
    items: [mockProduct],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(() => {
    const mockApiService = {
      getProducts: jest.fn(),
      getProduct: jest.fn(),
      findByBarcode: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      deleteProduct: jest.fn(),
      addBarcode: jest.fn(),
      removeBarcode: jest.fn(),
      getLowStockProducts: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductsStateService, { provide: ProductsApiService, useValue: mockApiService }],
    });

    service = TestBed.inject(ProductsStateService);
    apiService = TestBed.inject(ProductsApiService) as jest.Mocked<ProductsApiService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty products array', () => {
      expect(service.products()).toEqual([]);
    });

    it('should have loading as false', () => {
      expect(service.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(service.error()).toBe(null);
    });

    it('should have currentPage as 1', () => {
      expect(service.currentPage()).toBe(1);
    });
  });

  describe('loadProducts', () => {
    it('should load products successfully', (done) => {
      apiService.getProducts.mockReturnValue(of(mockProductsResponse));

      service.loadProducts();

      setTimeout(() => {
        expect(apiService.getProducts).toHaveBeenCalled();
        expect(service.products()).toEqual([mockProduct]);
        expect(service.total()).toBe(1);
        expect(service.totalPages()).toBe(1);
        expect(service.loading()).toBe(false);
        expect(service.error()).toBe(null);
        done();
      }, 100);
    });

    it('should set error when API fails', (done) => {
      const error = { message: 'API Error' };
      apiService.getProducts.mockReturnValue(throwError(() => error));

      service.loadProducts();

      setTimeout(() => {
        expect(service.error()).toBe('API Error');
        expect(service.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should apply search filter', (done) => {
      service.setSearchTerm('laptop');
      apiService.getProducts.mockReturnValue(of(mockProductsResponse));

      setTimeout(() => {
        expect(apiService.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'laptop' })
        );
        done();
      }, 100);
    });
  });

  describe('loadProduct', () => {
    it('should load a single product', (done) => {
      apiService.getProduct.mockReturnValue(of(mockProduct));

      service.loadProduct(1);

      setTimeout(() => {
        expect(apiService.getProduct).toHaveBeenCalledWith(1);
        expect(service.selectedProduct()).toEqual(mockProduct);
        expect(service.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Filters', () => {
    beforeEach(() => {
      apiService.getProducts.mockReturnValue(of(mockProductsResponse));
    });

    it('should set search term and reload products', (done) => {
      service.setSearchTerm('test');

      setTimeout(() => {
        expect(service.searchTerm()).toBe('test');
        expect(service.currentPage()).toBe(1);
        expect(apiService.getProducts).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set category filter', (done) => {
      service.setCategory('Electronics');

      setTimeout(() => {
        expect(service.categoryFilter()).toBe('Electronics');
        expect(service.currentPage()).toBe(1);
        done();
      }, 100);
    });

    it('should set active filter', (done) => {
      service.setActiveFilter(true);

      setTimeout(() => {
        expect(service.activeFilter()).toBe(true);
        expect(service.currentPage()).toBe(1);
        done();
      }, 100);
    });

    it('should set low stock filter', (done) => {
      service.setLowStockFilter(true);

      setTimeout(() => {
        expect(service.lowStockFilter()).toBe(true);
        expect(service.currentPage()).toBe(1);
        done();
      }, 100);
    });
  });

  describe('Pagination', () => {
    it('should change page', (done) => {
      apiService.getProducts.mockReturnValue(of(mockProductsResponse));

      service.setPage(2);

      setTimeout(() => {
        expect(service.currentPage()).toBe(2);
        expect(apiService.getProducts).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Computed Signals', () => {
    it('hasProducts should return false when products array is empty', () => {
      expect(service.hasProducts()).toBe(false);
    });

    it('hasProducts should return true when products exist', (done) => {
      apiService.getProducts.mockReturnValue(of(mockProductsResponse));
      service.loadProducts();

      setTimeout(() => {
        expect(service.hasProducts()).toBe(true);
        done();
      }, 100);
    });

    it('hasError should return false when no error', () => {
      expect(service.hasError()).toBe(false);
    });

    it('hasError should return true when error exists', (done) => {
      apiService.getProducts.mockReturnValue(throwError(() => ({ message: 'Error' })));
      service.loadProducts();

      setTimeout(() => {
        expect(service.hasError()).toBe(true);
        done();
      }, 100);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      service.products.set([mockProduct]);
      service.searchTerm.set('test');
      service.currentPage.set(2);
      service.error.set('Some error');

      service.reset();

      expect(service.products()).toEqual([]);
      expect(service.searchTerm()).toBe('');
      expect(service.currentPage()).toBe(1);
      expect(service.error()).toBe(null);
    });
  });
});
