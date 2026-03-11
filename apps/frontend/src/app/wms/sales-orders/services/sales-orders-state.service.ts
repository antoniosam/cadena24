import { Injectable, signal, computed, inject } from '@angular/core';
import {
  SalesOrder,
  SalesOrderStatus,
  SalesOrderPriority,
  QuerySalesOrdersDto,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  ValidateStockDto,
  StockValidationResult,
} from '@cadena24-wms/shared';
import { SalesOrdersApiService } from './sales-orders-api.service';

@Injectable({
  providedIn: 'root',
})
export class SalesOrdersStateService {
  private api = inject(SalesOrdersApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  salesOrders = signal<SalesOrder[]>([]);
  selectedOrder = signal<SalesOrder | null>(null);
  stockValidation = signal<StockValidationResult | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // ── Filters ────────────────────────────────────────────────────────────────
  statusFilter = signal<SalesOrderStatus | null>(null);
  priorityFilter = signal<SalesOrderPriority | null>(null);
  customerNameFilter = signal<string | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  hasOrders = computed(() => this.salesOrders().length > 0);
  hasError = computed(() => this.error() !== null);
  pendingOrders = computed(() => this.salesOrders().filter((o) => o.status === 'pending'));
  urgentOrders = computed(() =>
    this.salesOrders().filter((o) => o.priority === 'urgent' && o.status === 'pending')
  );

  // ── Load all ───────────────────────────────────────────────────────────────
  loadSalesOrders() {
    this.loading.set(true);
    this.error.set(null);

    const filters: QuerySalesOrdersDto = {
      status: this.statusFilter() ?? undefined,
      priority: this.priorityFilter() ?? undefined,
      customerName: this.customerNameFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getSalesOrders(filters).subscribe({
      next: (response) => {
        this.salesOrders.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar órdenes de venta');
        this.loading.set(false);
      },
    });
  }

  // ── Load one ───────────────────────────────────────────────────────────────
  loadSalesOrder(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getSalesOrder(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar la orden');
        this.loading.set(false);
      },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  createSalesOrder(
    dto: CreateSalesOrderDto,
    onSuccess: (order: SalesOrder) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.createSalesOrder(dto).subscribe({
      next: (order) => {
        this.saving.set(false);
        onSuccess(order);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al crear la orden';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  updateSalesOrder(
    id: number,
    dto: UpdateSalesOrderDto,
    onSuccess?: (order: SalesOrder) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.updateSalesOrder(id, dto).subscribe({
      next: (order) => {
        this.updateOrderInList(order);
        this.saving.set(false);
        onSuccess?.(order);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al actualizar la orden';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Priority ───────────────────────────────────────────────────────────────
  updatePriority(
    id: number,
    priority: SalesOrderPriority,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) {
    this.api.updatePriority(id, { priority }).subscribe({
      next: (order) => {
        this.updateOrderInList(order);
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cambiar prioridad';
        this.error.set(msg);
        onError?.(msg);
      },
    });
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  cancelSalesOrder(id: number, onSuccess?: () => void, onError?: (msg: string) => void) {
    this.api.cancelSalesOrder(id).subscribe({
      next: (order) => {
        this.updateOrderInList(order);
        if (this.selectedOrder()?.id === id) {
          this.selectedOrder.set(order);
        }
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cancelar la orden';
        this.error.set(msg);
        onError?.(msg);
      },
    });
  }

  // ── Validate stock ─────────────────────────────────────────────────────────
  validateStock(dto: ValidateStockDto) {
    this.api.validateStock(dto).subscribe({
      next: (result) => {
        this.stockValidation.set(result);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al validar stock');
      },
    });
  }

  clearStockValidation() {
    this.stockValidation.set(null);
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  setStatusFilter(status: SalesOrderStatus | null) {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  setPriorityFilter(priority: SalesOrderPriority | null) {
    this.priorityFilter.set(priority);
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  setCustomerNameFilter(name: string | null) {
    this.customerNameFilter.set(name);
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadSalesOrders();
  }

  clearFilters() {
    this.statusFilter.set(null);
    this.priorityFilter.set(null);
    this.customerNameFilter.set(null);
    this.currentPage.set(1);
    this.loadSalesOrders();
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  clearError() {
    this.error.set(null);
  }

  clearSelectedOrder() {
    this.selectedOrder.set(null);
  }

  updateOrderInList(updatedOrder: SalesOrder) {
    const orders = this.salesOrders();
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      const updated = [...orders];
      updated[index] = updatedOrder;
      this.salesOrders.set(updated);
    }
    if (this.selectedOrder()?.id === updatedOrder.id) {
      this.selectedOrder.set(updatedOrder);
    }
  }
}
