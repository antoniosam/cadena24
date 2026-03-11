import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SalesOrderListComponent } from './sales-order-list.component';
import { SalesOrdersStateService } from '../../services/sales-orders-state.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('SalesOrderListComponent', () => {
  let component: SalesOrderListComponent;
  let fixture: ComponentFixture<SalesOrderListComponent>;
  let stateMock: Partial<SalesOrdersStateService>;

  beforeEach(async () => {
    stateMock = {
      salesOrders: signal([]) as unknown as SalesOrdersStateService['salesOrders'],
      loading: signal(false) as unknown as SalesOrdersStateService['loading'],
      error: signal(null) as unknown as SalesOrdersStateService['error'],
      hasOrders: signal(false) as unknown as SalesOrdersStateService['hasOrders'],
      hasError: signal(false) as unknown as SalesOrdersStateService['hasError'],
      urgentOrders: signal([]) as unknown as SalesOrdersStateService['urgentOrders'],
      pendingOrders: signal([]) as unknown as SalesOrdersStateService['pendingOrders'],
      currentPage: signal(1) as unknown as SalesOrdersStateService['currentPage'],
      totalPages: signal(1) as unknown as SalesOrdersStateService['totalPages'],
      total: signal(0) as unknown as SalesOrdersStateService['total'],
      loadSalesOrders: jest.fn(),
      setStatusFilter: jest.fn(),
      setPriorityFilter: jest.fn(),
      setCustomerNameFilter: jest.fn(),
      setPage: jest.fn(),
      clearFilters: jest.fn(),
      cancelSalesOrder: jest.fn(),
      updatePriority: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SalesOrderListComponent],
      providers: [provideRouter([]), { provide: SalesOrdersStateService, useValue: stateMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(SalesOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sales orders on init', () => {
    expect(stateMock.loadSalesOrders).toHaveBeenCalled();
  });

  it('should return correct status badge class', () => {
    expect(component.getStatusBadgeClass('pending')).toBe('badge-warning');
    expect(component.getStatusBadgeClass('picking')).toBe('badge-info');
    expect(component.getStatusBadgeClass('shipped')).toBe('badge-success');
    expect(component.getStatusBadgeClass('cancelled')).toBe('badge-danger');
  });

  it('should return correct priority badge class', () => {
    expect(component.getPriorityBadgeClass('urgent')).toBe('badge-danger');
    expect(component.getPriorityBadgeClass('high')).toBe('badge-warning');
    expect(component.getPriorityBadgeClass('normal')).toBe('badge-secondary');
  });

  it('should allow cancel for pending/picking/picked orders', () => {
    expect(component.canCancel('pending')).toBe(true);
    expect(component.canCancel('picking')).toBe(true);
    expect(component.canCancel('shipped')).toBe(false);
    expect(component.canCancel('cancelled')).toBe(false);
  });

  it('should clear filters and reset search', () => {
    component.customerSearch = 'test';
    component.clearFilters();
    expect(component.customerSearch).toBe('');
    expect(stateMock.clearFilters).toHaveBeenCalled();
  });
});
