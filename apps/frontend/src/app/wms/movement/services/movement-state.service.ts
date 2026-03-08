import { Injectable, signal, computed, inject } from '@angular/core';
import {
  MovementOrder,
  MovementOrderLine,
  MovementOrdersResponse,
  MovementStatus,
  MovementType,
  CreateMovementOrderDto,
  ExecuteMovementLineDto,
} from '@cadena24-wms/shared';
import { MovementApiService } from './movement-api.service';

@Injectable({
  providedIn: 'root',
})
export class MovementStateService {
  private readonly api = inject(MovementApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  movementOrders = signal<MovementOrder[]>([]);
  selectedOrder = signal<MovementOrder | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // ── Filters ────────────────────────────────────────────────────────────────
  warehouseFilter = signal<number | null>(null);
  statusFilter = signal<MovementStatus | null>(null);
  typeFilter = signal<MovementType | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  hasOrders = computed(() => this.movementOrders().length > 0);
  hasError = computed(() => this.error() !== null);
  isOrderInProgress = computed(() => this.selectedOrder()?.status === 'in_progress');
  hasPendingLines = computed(
    () => this.selectedOrder()?.lines?.some((l) => l.status === 'pending') ?? false
  );
  pendingLinesCount = computed(
    () => this.selectedOrder()?.lines?.filter((l) => l.status === 'pending').length ?? 0
  );
  completedLinesCount = computed(
    () => this.selectedOrder()?.lines?.filter((l) => l.status === 'completed').length ?? 0
  );

  // ── Load ───────────────────────────────────────────────────────────────────

  loadMovementOrders() {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      warehouseId: this.warehouseFilter() ?? undefined,
      status: this.statusFilter() ?? undefined,
      movementType: this.typeFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getMovementOrders(filters).subscribe({
      next: (response: MovementOrdersResponse) => {
        this.movementOrders.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err.error?.message || err.message || 'Error al cargar órdenes de movimiento'
        );
        this.loading.set(false);
      },
    });
  }

  loadMovementOrder(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getMovementOrder(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar orden de movimiento');
        this.loading.set(false);
      },
    });
  }

  createOrder(
    dto: CreateMovementOrderDto,
    onSuccess: (order: MovementOrder) => void,
    onError?: (msg: string) => void
  ) {
    this.loading.set(true);
    this.error.set(null);

    this.api.createMovementOrder(dto).subscribe({
      next: (order) => {
        this.loading.set(false);
        onSuccess(order);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al crear la orden de movimiento';
        this.error.set(msg);
        this.loading.set(false);
        onError?.(msg);
      },
    });
  }

  startExecution(id: number, onSuccess?: () => void, onError?: (msg: string) => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.startExecution(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.updateOrderInList(order);
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al iniciar la orden';
        this.error.set(msg);
        this.loading.set(false);
        onError?.(msg);
      },
    });
  }

  executeLine(
    orderId: number,
    dto: ExecuteMovementLineDto,
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) {
    this.loading.set(true);
    this.error.set(null);

    this.api.executeLine(orderId, dto).subscribe({
      next: (updatedLine) => {
        this.updateLineInOrder(updatedLine as MovementOrderLine);
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al ejecutar la línea';
        this.error.set(msg);
        this.loading.set(false);
        onError?.(msg);
      },
    });
  }

  completeOrder(id: number, onSuccess?: () => void, onError?: (msg: string) => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.completeMovementOrder(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        this.updateOrderInList(order);
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al completar la orden';
        this.error.set(msg);
        this.loading.set(false);
        onError?.(msg);
      },
    });
  }

  cancelOrder(id: number, onSuccess?: () => void, onError?: (msg: string) => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.cancelMovementOrder(id).subscribe({
      next: () => {
        this.loadMovementOrders();
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cancelar la orden';
        this.error.set(msg);
        this.loading.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  setWarehouseFilter(id: number | null) {
    this.warehouseFilter.set(id);
    this.currentPage.set(1);
    this.loadMovementOrders();
  }

  setStatusFilter(status: MovementStatus | null) {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadMovementOrders();
  }

  setTypeFilter(type: MovementType | null) {
    this.typeFilter.set(type);
    this.currentPage.set(1);
    this.loadMovementOrders();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadMovementOrders();
  }

  clearFilters() {
    this.warehouseFilter.set(null);
    this.statusFilter.set(null);
    this.typeFilter.set(null);
    this.currentPage.set(1);
    this.loadMovementOrders();
  }

  clearError() {
    this.error.set(null);
  }

  clearSelectedOrder() {
    this.selectedOrder.set(null);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  updateOrderInList(updatedOrder: MovementOrder) {
    const orders = this.movementOrders();
    const idx = orders.findIndex((o) => o.id === updatedOrder.id);
    if (idx !== -1) {
      const updated = [...orders];
      updated[idx] = updatedOrder;
      this.movementOrders.set(updated);
    }
    this.selectedOrder.set(updatedOrder);
  }

  updateLineInOrder(updatedLine: MovementOrderLine) {
    const order = this.selectedOrder();
    if (!order?.lines) return;

    const lines = [...order.lines];
    const idx = lines.findIndex((l) => l.id === updatedLine.id);
    if (idx !== -1) {
      lines[idx] = updatedLine;
      const updatedOrder = { ...order, lines };
      this.selectedOrder.set(updatedOrder);
    }
  }
}
