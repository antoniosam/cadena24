import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { WarehousesStateService } from './warehouses-state.service';
import { WarehousesApiService } from './warehouses-api.service';
import { Warehouse } from '@cadena24-wms/shared';

describe('WarehousesStateService', () => {
  let service: WarehousesStateService;
  let apiService: jest.Mocked<WarehousesApiService>;

  const mockWarehouse: Warehouse = {
    id: 1,
    code: 'WH-001',
    name: 'Almacén Principal',
    address: 'Calle 123',
    city: 'Ciudad',
    state: 'Estado',
    zipCode: '12345',
    isPrimary: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    const mockApiService = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      getPrimary: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        WarehousesStateService,
        { provide: WarehousesApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(WarehousesStateService);
    apiService = TestBed.inject(WarehousesApiService) as jest.Mocked<WarehousesApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty warehouses array initially', () => {
    expect(service.warehouses()).toEqual([]);
  });

  it('should load warehouses successfully', (done) => {
    const response = {
      items: [mockWarehouse],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    apiService.getAll.mockReturnValue(of(response));

    service.loadWarehouses();

    setTimeout(() => {
      expect(apiService.getAll).toHaveBeenCalled();
      expect(service.warehouses()).toEqual([mockWarehouse]);
      expect(service.total()).toBe(1);
      expect(service.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should handle error when loading warehouses', (done) => {
    const error = { message: 'API Error' };
    apiService.getAll.mockReturnValue(throwError(() => error));

    service.loadWarehouses();

    setTimeout(() => {
      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBe(false);
      done();
    }, 100);
  });
});
