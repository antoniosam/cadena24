import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductBulkImportModalComponent } from './product-bulk-import-modal.component';
import { ProductImportService } from '../../services/product-import.service';
import { ProductsApiService } from '../../../products/services/products-api.service';
import { of, throwError } from 'rxjs';
import { IProductImportRow } from '@cadena24-wms/shared';

describe('ProductBulkImportModalComponent', () => {
  let component: ProductBulkImportModalComponent;
  let fixture: ComponentFixture<ProductBulkImportModalComponent>;
  let mockImportService: jasmine.SpyObj<ProductImportService>;
  let mockProductsApi: jasmine.SpyObj<ProductsApiService>;

  beforeEach(async () => {
    mockImportService = jasmine.createSpyObj('ProductImportService', [
      'parseExcelFile',
      'validateRows',
      'generateTemplate',
    ]);
    mockProductsApi = jasmine.createSpyObj('ProductsApiService', ['getProducts']);

    await TestBed.configureTestingModule({
      imports: [ProductBulkImportModalComponent],
      providers: [
        { provide: ProductImportService, useValue: mockImportService },
        { provide: ProductsApiService, useValue: mockProductsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductBulkImportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open modal', () => {
    component.open();
    expect(component.isVisible()).toBe(true);
    expect(component.step()).toBe('upload');
  });

  it('should close modal', () => {
    component.open();
    component.close();
    expect(component.isVisible()).toBe(false);
  });

  it('should download template', () => {
    component.downloadTemplate();
    expect(mockImportService.generateTemplate).toHaveBeenCalled();
  });

  it('should parse Excel file successfully', () => {
    const mockRows: IProductImportRow[] = [
      { codigoProducto: 'PROD-001', cantidadEsperada: 10, costoUnitario: 25.5 },
    ];

    const validationResult = {
      isValid: true,
      errors: [],
      validRows: mockRows,
      totalRows: 1,
    };

    mockImportService.parseExcelFile.and.returnValue(of(mockRows));
    mockImportService.validateRows.and.returnValue(of(validationResult));

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    component.parseFile(file);

    expect(mockImportService.parseExcelFile).toHaveBeenCalledWith(file);
  });

  it('should handle parse errors', () => {
    mockImportService.parseExcelFile.and.returnValue(throwError(() => new Error('Parse error')));

    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    component.parseFile(file);

    expect(component.error()).toBe('Parse error');
    expect(component.isProcessing()).toBe(false);
  });

  it('should reset state on reset', () => {
    component.open();
    component.reset();

    expect(component.step()).toBe('upload');
    expect(component.selectedFile()).toBeNull();
    expect(component.parsedRows()).toEqual([]);
    expect(component.validationResult()).toBeNull();
    expect(component.isProcessing()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should filter out the first row if its product code is null or empty', () => {
    const mockRows: IProductImportRow[] = [
      { codigoProducto: '', cantidadEsperada: 0, costoUnitario: 0 },
      { codigoProducto: 'PROD-002', cantidadEsperada: 5, costoUnitario: 10 },
    ];
    const filteredRows = component.filterEmptyFirstRow(mockRows);
    expect(filteredRows.length).toBe(1);
    expect(filteredRows[0].codigoProducto).toBe('PROD-002');
  });
});
