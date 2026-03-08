import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProductListComponent } from './product-list.component';
import { ProductsStateService } from '../../services/products-state.service';
import { Product } from '@cadena24-wms/shared';
import { signal } from '@angular/core';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let mockStateService: jest.Mocked<ProductsStateService>;
  let mockRouter: jest.Mocked<Router>;

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
  };

  beforeEach(async () => {
    mockStateService = {
      products: signal([mockProduct]),
      selectedProduct: signal(null),
      loading: signal(false),
      error: signal(null),
      currentPage: signal(1),
      totalPages: signal(1),
      total: signal(1),
      searchTerm: signal(''),
      categoryFilter: signal(null),
      activeFilter: signal(null),
      lowStockFilter: signal(false),
      hasProducts: signal(true),
      hasError: signal(false),
      loadProducts: jest.fn(),
      loadProduct: jest.fn(),
      setSearchTerm: jest.fn(),
      setCategory: jest.fn(),
      setActiveFilter: jest.fn(),
      setLowStockFilter: jest.fn(),
      setPage: jest.fn(),
      reset: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductsStateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load products on initialization', () => {
      component.ngOnInit();
      expect(mockStateService.loadProducts).toHaveBeenCalled();
    });
  });

  describe('Search', () => {
    it('should call setSearchTerm when searching', () => {
      const searchTerm = 'laptop';
      component.onSearch(searchTerm);
      expect(mockStateService.setSearchTerm).toHaveBeenCalledWith(searchTerm);
    });
  });

  describe('Filters', () => {
    it('should call setLowStockFilter when toggling low stock filter', () => {
      component.onFilterLowStock(true);
      expect(mockStateService.setLowStockFilter).toHaveBeenCalledWith(true);
    });
  });

  describe('Pagination', () => {
    it('should call setPage when changing page', () => {
      component.onPageChange(2);
      expect(mockStateService.setPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      component.onCreate();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/products/new']);
    });

    it('should navigate to edit page', () => {
      component.onEdit(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/products', 1, 'edit']);
    });

    it('should navigate to view page', () => {
      component.onView(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/products', 1]);
    });
  });

  describe('Template Rendering', () => {
    it('should display products in table', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('.products-table');
      expect(table).toBeTruthy();
    });

    it('should show loading state', () => {
      mockStateService.loading = signal(true);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const loading = compiled.querySelector('.loading');
      expect(loading).toBeTruthy();
    });

    it('should show error state', () => {
      mockStateService.hasError = signal(true);
      mockStateService.error = signal('Test error');
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const error = compiled.querySelector('.error');
      expect(error).toBeTruthy();
    });

    it('should show empty state when no products', () => {
      mockStateService.hasProducts = signal(false);
      mockStateService.products = signal([]);
      mockStateService.loading = signal(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });
});
