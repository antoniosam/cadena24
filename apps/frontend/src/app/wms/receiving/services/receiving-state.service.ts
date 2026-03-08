import { Injectable, signal, computed, inject } from '@angular/core';
import { ReceivingOrder, Location, DamagedItem, ReceivingOrderLine } from '@cadena24-wms/shared';
import { ReceivingApiService } from './receiving-api.service';

@Injectable({
  providedIn: 'root',
})
export class ReceivingStateService {
  private api = inject(ReceivingApiService);

  // State
  receivingOrders = signal<ReceivingOrder[]>([]);
  selectedOrder = signal<ReceivingOrder | null>(null);
  availableLocations = signal<Location[]>([]);
  damagedItems = signal<DamagedItem[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // Filters
  warehouseFilter = signal<number | null>(null);
  statusFilter = signal<'pending' | 'in_progress' | 'completed' | 'cancelled' | null>(null);
  fromDateFilter = signal<Date | null>(null);
  toDateFilter = signal<Date | null>(null);

  // Computed
  hasOrders = computed(() => this.receivingOrders().length > 0);
  hasError = computed(() => this.error() !== null);
  isOrderInProgress = computed(() => this.selectedOrder()?.status === 'in_progress');
  hasPendingLines = computed(() => {
    const order = this.selectedOrder();
    return order?.lines?.some((line) => line.status === 'pending') ?? false;
  });

  loadReceivingOrders() {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      warehouseId: this.warehouseFilter() || undefined,
      status: this.statusFilter() || undefined,
      fromDate: this.fromDateFilter() || undefined,
      toDate: this.toDateFilter() || undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getReceivingOrders(filters).subscribe({
      next: (response) => {
        this.receivingOrders.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar órdenes de recepción';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadReceivingOrder(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getReceivingOrder(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar orden de recepción';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadReceivingLocations(orderId: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getReceivingLocations(orderId).subscribe({
      next: (locations) => {
        this.availableLocations.set(locations);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar ubicaciones de recepción';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadDamagedItems(warehouseId?: number, fromDate?: Date, toDate?: Date) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getDamagedItems({ warehouseId, fromDate, toDate }).subscribe({
      next: (items) => {
        this.damagedItems.set(items);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar items dañados';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setWarehouseFilter(warehouseId: number | null) {
    this.warehouseFilter.set(warehouseId);
    this.currentPage.set(1);
    this.loadReceivingOrders();
  }

  setStatusFilter(status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | null) {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadReceivingOrders();
  }

  setDateFilter(fromDate: Date | null, toDate: Date | null) {
    this.fromDateFilter.set(fromDate);
    this.toDateFilter.set(toDate);
    this.currentPage.set(1);
    this.loadReceivingOrders();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadReceivingOrders();
  }

  clearFilters() {
    this.warehouseFilter.set(null);
    this.statusFilter.set(null);
    this.fromDateFilter.set(null);
    this.toDateFilter.set(null);
    this.currentPage.set(1);
    this.loadReceivingOrders();
  }

  clearError() {
    this.error.set(null);
  }

  clearSelectedOrder() {
    this.selectedOrder.set(null);
    this.availableLocations.set([]);
  }

  // Update order in list after changes
  updateOrderInList(updatedOrder: ReceivingOrder) {
    const orders = this.receivingOrders();
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      const updated = [...orders];
      updated[index] = updatedOrder;
      this.receivingOrders.set(updated);
    }
    this.selectedOrder.set(updatedOrder);
  }

  // Update line in selected order
  updateLineInOrder(updatedLine: ReceivingOrderLine) {
    const order = this.selectedOrder();
    if (!order || !order.lines) return;

    const lines = [...order.lines];
    const index = lines.findIndex((l) => l.id === updatedLine.id);
    if (index !== -1) {
      lines[index] = updatedLine;
      const updatedOrder = { ...order, lines };
      this.selectedOrder.set(updatedOrder);
      this.updateOrderInList(updatedOrder);
    }
  }
}
