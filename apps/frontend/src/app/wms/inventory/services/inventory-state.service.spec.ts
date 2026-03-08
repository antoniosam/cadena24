import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { InventoryStateService } from './inventory-state.service';
import { InventoryApiService } from './inventory-api.service';
import { Inventory, InventoryAdjustment, InventoryTransaction } from '@cadena24-wms/shared';

describe('InventoryStateService', () => {
  let service: InventoryStateService;
  let apiService: jest.Mocked<InventoryApiService>;

  const mockInventory: Inventory = {
    id: 'inv-001',
    productId: 'prod-001',
    levelId: 'level-001',
    warehouseId: 'wh-001',
    quantity: 100,
    availableQuantity: 80,
    reservedQuantity: 20,
    status: 'available',
    updatedAt: new Date(),
  };

  const mockAdjustment: InventoryAdjustment = {
    id: 'adj-001',
    adjustmentNumber: 'ADJ-2026-0001',
    warehouseId: 'wh-001',
    reason: 'PHYSICAL_COUNT',
    status: 'draft',
    createdAt: new Date(),
    lines: [],
  };

  const mockTransaction: InventoryTransaction = {
    id: 'tx-001',
    productId: 'prod-001',
    warehouseId: 'wh-001',
    quantity: 10,
    transactionType: 'RECEIVE',
    referenceType: 'MANUAL',
    createdAt: new Date(),
  };

  beforeEach(() => {
    const mockApiService = {
      getInventory: jest.fn(),
      getAvailableStock: jest.fn(),
      getStockByProduct: jest.fn(),
      getStockByLocation: jest.fn(),
      reserveInventory: jest.fn(),
      releaseReservation: jest.fn(),
      getTransactionHistory: jest.fn(),
      createAdjustment: jest.fn(),
      getAdjustments: jest.fn(),
      getAdjustment: jest.fn(),
      approveAdjustment: jest.fn(),
      cancelAdjustment: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        InventoryStateService,
        { provide: InventoryApiService, useValue: mockApiService },
      ],
    });

    service = TestBed.inject(InventoryStateService);
    apiService = TestBed.inject(InventoryApiService) as jest.Mocked<InventoryApiService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have empty inventory', () => {
      expect(service.inventory()).toEqual([]);
    });

    it('should have loading as false', () => {
      expect(service.loading()).toBe(false);
    });

    it('should have null error', () => {
      expect(service.error()).toBe(null);
    });

    it('should have empty adjustments', () => {
      expect(service.adjustments()).toEqual([]);
    });

    it('hasInventory should be false initially', () => {
      expect(service.hasInventory()).toBe(false);
    });
  });

  describe('loadInventory', () => {
    it('should load inventory successfully', (done) => {
      apiService.getInventory.mockReturnValue(of([mockInventory]));

      service.loadInventory();

      setTimeout(() => {
        expect(service.inventory()).toEqual([mockInventory]);
        expect(service.loading()).toBe(false);
        expect(service.error()).toBe(null);
        expect(service.hasInventory()).toBe(true);
        done();
      }, 100);
    });

    it('should set error when API fails', (done) => {
      apiService.getInventory.mockReturnValue(throwError(() => ({ message: 'Error de red' })));

      service.loadInventory();

      setTimeout(() => {
        expect(service.error()).toBe('Error de red');
        expect(service.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should load inventory with filters', (done) => {
      apiService.getInventory.mockReturnValue(of([mockInventory]));

      service.loadInventory({ warehouseId: 'wh-001', productId: 'prod-001' });

      setTimeout(() => {
        expect(apiService.getInventory).toHaveBeenCalledWith({
          warehouseId: 'wh-001',
          productId: 'prod-001',
        });
        done();
      }, 100);
    });
  });

  describe('loadTransactions', () => {
    it('should load transactions successfully', (done) => {
      apiService.getTransactionHistory.mockReturnValue(of([mockTransaction]));

      service.loadTransactions();

      setTimeout(() => {
        expect(service.transactions()).toEqual([mockTransaction]);
        expect(service.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('loadAdjustments', () => {
    it('should load adjustments successfully', (done) => {
      apiService.getAdjustments.mockReturnValue(of([mockAdjustment]));

      service.loadAdjustments();

      setTimeout(() => {
        expect(service.adjustments()).toEqual([mockAdjustment]);
        expect(service.loading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('createAdjustment', () => {
    it('should add created adjustment to state', (done) => {
      apiService.createAdjustment.mockReturnValue(of(mockAdjustment));

      service.createAdjustment({
        warehouseId: 'wh-001',
        reason: 'PHYSICAL_COUNT',
        lines: [],
      });

      setTimeout(() => {
        expect(service.adjustments()).toContainEqual(mockAdjustment);
        done();
      }, 100);
    });
  });

  describe('approveAdjustment', () => {
    it('should update adjustment status on approval', (done) => {
      const approved = { ...mockAdjustment, status: 'approved' as const };
      service.adjustments.set([mockAdjustment]);
      apiService.approveAdjustment.mockReturnValue(of(approved));

      service.approveAdjustment('adj-001');

      setTimeout(() => {
        expect(service.adjustments()[0].status).toBe('approved');
        done();
      }, 100);
    });
  });

  describe('cancelAdjustment', () => {
    it('should update adjustment status on cancellation', (done) => {
      service.adjustments.set([mockAdjustment]);
      apiService.cancelAdjustment.mockReturnValue(of(undefined));

      service.cancelAdjustment('adj-001');

      setTimeout(() => {
        expect(service.adjustments()[0].status).toBe('cancelled');
        done();
      }, 100);
    });
  });

  describe('draftAdjustments computed', () => {
    it('should return only draft adjustments', () => {
      service.adjustments.set([
        { ...mockAdjustment, status: 'draft' },
        { ...mockAdjustment, id: 'adj-002', status: 'approved' as const },
      ]);

      expect(service.draftAdjustments().length).toBe(1);
      expect(service.draftAdjustments()[0].status).toBe('draft');
    });
  });

  describe('Filters', () => {
    it('should set warehouse filter', () => {
      service.setWarehouseFilter('wh-001');
      expect(service.warehouseFilter()).toBe('wh-001');
    });

    it('should set product filter', () => {
      service.setProductFilter('prod-001');
      expect(service.productFilter()).toBe('prod-001');
    });

    it('should set status filter', () => {
      service.setStatusFilter('available');
      expect(service.statusFilter()).toBe('available');
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      service.inventory.set([mockInventory]);
      service.adjustments.set([mockAdjustment]);
      service.error.set('error');
      service.warehouseFilter.set('wh-001');

      service.reset();

      expect(service.inventory()).toEqual([]);
      expect(service.adjustments()).toEqual([]);
      expect(service.error()).toBe(null);
      expect(service.warehouseFilter()).toBe(null);
    });
  });
});
