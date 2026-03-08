import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InventoryListComponent } from './inventory-list.component';
import { InventoryStateService } from '../../services/inventory-state.service';
import { InventoryApiService } from '../../services/inventory-api.service';
import { signal } from '@angular/core';
import { Inventory } from '@cadena24-wms/shared';

describe('InventoryListComponent', () => {
  let component: InventoryListComponent;
  let fixture: ComponentFixture<InventoryListComponent>;
  let stateService: jest.Mocked<InventoryStateService>;

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

  const mockStateService = {
    inventory: signal<Inventory[]>([]),
    transactions: signal([]),
    adjustments: signal([]),
    loading: signal(false),
    error: signal<string | null>(null),
    hasInventory: signal(false),
    hasError: signal(false),
    loadInventory: jest.fn(),
    loadTransactions: jest.fn(),
    draftAdjustments: signal([]),
    warehouseFilter: signal(null),
    productFilter: signal(null),
    statusFilter: signal(null),
    availableStock: signal(0),
    selectedAdjustment: signal(null),
    setWarehouseFilter: jest.fn(),
    setProductFilter: jest.fn(),
    setStatusFilter: jest.fn(),
    reset: jest.fn(),
    reserveInventory: jest.fn(),
    releaseReservation: jest.fn(),
    loadAdjustments: jest.fn(),
    loadAdjustment: jest.fn(),
    createAdjustment: jest.fn(),
    approveAdjustment: jest.fn(),
    cancelAdjustment: jest.fn(),
    loadAvailableStock: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryListComponent],
      providers: [
        { provide: InventoryStateService, useValue: mockStateService },
        {
          provide: InventoryApiService,
          useValue: {
            getInventory: jest.fn(),
            getTransactionHistory: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryListComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(InventoryStateService) as jest.Mocked<InventoryStateService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadInventory on init', () => {
    fixture.detectChanges();
    expect(stateService.loadInventory).toHaveBeenCalled();
  });

  it('should call loadInventory with filters', () => {
    component.warehouseId = 'wh-001';
    component.productId = 'prod-001';

    component.onFilterByWarehouse();

    expect(stateService.loadInventory).toHaveBeenCalledWith({
      warehouseId: 'wh-001',
      productId: 'prod-001',
    });
  });

  it('should call loadInventory without empty filters', () => {
    component.warehouseId = '';
    component.productId = '';

    component.onFilterByWarehouse();

    expect(stateService.loadInventory).toHaveBeenCalledWith({
      warehouseId: undefined,
      productId: undefined,
    });
  });

  it('should call loadTransactions', () => {
    component.warehouseId = 'wh-001';

    component.onLoadTransactions();

    expect(stateService.loadTransactions).toHaveBeenCalledWith({
      warehouseId: 'wh-001',
      productId: undefined,
      limit: 50,
    });
  });

  describe('getStatusLabel', () => {
    it('should return Spanish labels for status', () => {
      expect(component.getStatusLabel('available')).toBe('Disponible');
      expect(component.getStatusLabel('reserved')).toBe('Reservado');
      expect(component.getStatusLabel('damaged')).toBe('Dañado');
      expect(component.getStatusLabel('quarantine')).toBe('Cuarentena');
    });

    it('should return the key for unknown status', () => {
      expect(component.getStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('getStatusClass', () => {
    it('should return correct CSS class for status', () => {
      expect(component.getStatusClass('available')).toBe('badge-success');
      expect(component.getStatusClass('reserved')).toBe('badge-warning');
      expect(component.getStatusClass('damaged')).toBe('badge-danger');
    });
  });

  describe('getTransactionTypeLabel', () => {
    it('should return Spanish labels for transaction types', () => {
      expect(component.getTransactionTypeLabel('RECEIVE')).toBe('Recepción');
      expect(component.getTransactionTypeLabel('MOVE')).toBe('Movimiento');
      expect(component.getTransactionTypeLabel('PICK')).toBe('Picking');
      expect(component.getTransactionTypeLabel('ADJUST')).toBe('Ajuste');
      expect(component.getTransactionTypeLabel('DAMAGE')).toBe('Daño');
    });
  });
});
