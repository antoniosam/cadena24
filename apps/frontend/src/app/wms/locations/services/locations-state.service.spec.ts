import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { LocationsStateService } from './locations-state.service';
import { LocationsApiService } from './locations-api.service';
import { Location } from '@cadena24-wms/shared';

describe('LocationsStateService', () => {
  let service: LocationsStateService;
  let apiService: jest.Mocked<LocationsApiService>;

  const mockLocation: Location = {
    id: 1,
    warehouseId: 1,
    zone: 'A',
    row: '01',
    position: '01',
    level: '1',
    barcode: 'LOC-A-01-01-1',
    fullPath: 'A-01-01-1',
    name: 'Ubicación Test',
    type: 'storage',
    sequence: 1,
    height: 2.5,
    capacity: 100,
    maxWeight: 500,
    allowMixedProducts: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    const mockApiService = {
      getAll: jest.fn(),
      getOne: jest.fn(),
      getByBarcode: jest.fn(),
      getWarehouseTree: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LocationsStateService,
        { provide: LocationsApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(LocationsStateService);
    apiService = TestBed.inject(LocationsApiService) as jest.Mocked<LocationsApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty locations array initially', () => {
    expect(service.locations()).toEqual([]);
  });

  it('should load locations successfully', (done) => {
    const response = {
      items: [mockLocation],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    apiService.getAll.mockReturnValue(of(response));

    service.loadLocations();

    setTimeout(() => {
      expect(apiService.getAll).toHaveBeenCalled();
      expect(service.locations()).toEqual([mockLocation]);
      expect(service.total()).toBe(1);
      expect(service.loading()).toBe(false);
      done();
    }, 100);
  });

  it('should handle error when loading locations', (done) => {
    const error = { message: 'API Error' };
    apiService.getAll.mockReturnValue(throwError(() => error));

    service.loadLocations();

    setTimeout(() => {
      expect(service.error()).toBeTruthy();
      expect(service.loading()).toBe(false);
      done();
    }, 100);
  });
});
