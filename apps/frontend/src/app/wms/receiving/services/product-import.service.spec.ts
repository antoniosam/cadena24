import { TestBed } from '@angular/core/testing';
import { ProductImportService } from './product-import.service';
import { ProductsApiService } from '../../products/services/products-api.service';
import { of } from 'rxjs';
import { IProductImportRow } from '@cadena24-wms/shared';

describe('ProductImportService', () => {
  let service: ProductImportService;
  let mockProductsApi: jasmine.SpyObj<ProductsApiService>;

  beforeEach(() => {
    mockProductsApi = jasmine.createSpyObj('ProductsApiService', ['getProducts']);

    TestBed.configureTestingModule({
      providers: [ProductImportService, { provide: ProductsApiService, useValue: mockProductsApi }],
    });

    service = TestBed.inject(ProductImportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateRows', () => {
    it('should detect missing product code', (done) => {
      const rows: IProductImportRow[] = [
        { codigoProducto: '', cantidadEsperada: 10, costoUnitario: 25.5 },
      ];

      service.validateRows(rows).subscribe((result) => {
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].field).toBe('codigoProducto');
        done();
      });
    });

    it('should detect invalid quantity', (done) => {
      const rows: IProductImportRow[] = [
        { codigoProducto: 'PROD-001', cantidadEsperada: -5, costoUnitario: 25.5 },
      ];

      service.validateRows(rows).subscribe((result) => {
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'cantidadEsperada')).toBe(true);
        done();
      });
    });

    it('should detect invalid unit cost', (done) => {
      const rows: IProductImportRow[] = [
        { codigoProducto: 'PROD-001', cantidadEsperada: 10, costoUnitario: -10 },
      ];

      service.validateRows(rows).subscribe((result) => {
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'costoUnitario')).toBe(true);
        done();
      });
    });

    it('should validate product codes against database', (done) => {
      const rows: IProductImportRow[] = [
        { codigoProducto: 'PROD-001', cantidadEsperada: 10, costoUnitario: 25.5 },
      ];

      mockProductsApi.getProducts.and.returnValue(
        of({
          items: [{ id: 1, code: 'PROD-001', name: 'Product 1' } as any],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );

      service.validateRows(rows).subscribe((result) => {
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
        expect(mockProductsApi.getProducts).toHaveBeenCalled();
        done();
      });
    });

    it('should detect non-existent product codes', (done) => {
      const rows: IProductImportRow[] = [
        { codigoProducto: 'PROD-999', cantidadEsperada: 10, costoUnitario: 25.5 },
      ];

      mockProductsApi.getProducts.and.returnValue(
        of({
          items: [{ id: 1, code: 'PROD-001', name: 'Product 1' } as any],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );

      service.validateRows(rows).subscribe((result) => {
        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.message.includes('no existe'))).toBe(true);
        done();
      });
    });
  });

  describe('generateTemplate', () => {
    it('should generate Excel template', () => {
      // This is a simple smoke test - actual file generation is harder to test
      expect(() => service.generateTemplate()).not.toThrow();
    });
  });
});
