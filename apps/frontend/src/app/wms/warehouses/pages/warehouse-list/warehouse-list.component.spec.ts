import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WarehouseListComponent } from './warehouse-list.component';
import { WarehousesStateService } from '../../services/warehouses-state.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('WarehouseListComponent', () => {
  let component: WarehouseListComponent;
  let fixture: ComponentFixture<WarehouseListComponent>;
  let mockStateService: any;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(async () => {
    mockStateService = {
      warehouses: signal([]),
      loading: signal(false),
      error: signal(null),
      hasWarehouses: signal(false),
      hasError: signal(false),
      searchTerm: signal(''),
      activeFilter: signal(null),
      primaryFilter: signal(null),
      currentPage: signal(1),
      totalPages: signal(1),
      loadWarehouses: jest.fn(),
      setSearchTerm: jest.fn(),
      setActiveFilter: jest.fn(),
      setPrimaryFilter: jest.fn(),
      setPage: jest.fn(),
      deleteWarehouse: jest.fn(),
    };

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [WarehouseListComponent],
      providers: [
        { provide: WarehousesStateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WarehouseListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load warehouses on init', () => {
    component.ngOnInit();
    expect(mockStateService.loadWarehouses).toHaveBeenCalled();
  });

  it('should navigate to create form', () => {
    component.onCreate();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/warehouses/new']);
  });

  it('should navigate to edit form', () => {
    component.onEdit(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/wms/warehouses', 1, 'edit']);
  });
});
