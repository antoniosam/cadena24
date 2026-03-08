import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Inventory,
  InventoryTransaction,
  InventoryAdjustment,
  CreateAdjustmentDto,
  ReserveInventoryDto,
  ReleaseReservationDto,
} from '@cadena24-wms/shared';
import { InventoryApiService } from './inventory-api.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryStateService {
  private readonly api = inject(InventoryApiService);

  // State — inventory list
  inventory = signal<Inventory[]>([]);
  transactions = signal<InventoryTransaction[]>([]);
  adjustments = signal<InventoryAdjustment[]>([]);
  selectedAdjustment = signal<InventoryAdjustment | null>(null);
  availableStock = signal<number>(0);

  // Filters
  warehouseFilter = signal<string | null>(null);
  productFilter = signal<string | null>(null);
  statusFilter = signal<string | null>(null);

  // UI state
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed
  hasInventory = computed(() => this.inventory().length > 0);
  hasError = computed(() => this.error() !== null);
  draftAdjustments = computed(() => this.adjustments().filter((a) => a.status === 'draft'));

  // ==================== INVENTORY ====================
  loadInventory(filters?: {
    productId?: string;
    levelId?: string;
    warehouseId?: string;
    status?: string;
  }) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getInventory(filters).subscribe({
      next: (data) => {
        this.inventory.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar inventario');
        this.loading.set(false);
      },
    });
  }

  loadAvailableStock(productId: string, warehouseId?: string) {
    this.api.getAvailableStock(productId, warehouseId).subscribe({
      next: (stock) => this.availableStock.set(stock),
      error: (err) => this.error.set(err.message || 'Error al consultar stock'),
    });
  }

  reserveInventory(dto: ReserveInventoryDto, onSuccess?: () => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.reserveInventory(dto).subscribe({
      next: () => {
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al reservar inventario');
        this.loading.set(false);
      },
    });
  }

  releaseReservation(dto: ReleaseReservationDto, onSuccess?: () => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.releaseReservation(dto).subscribe({
      next: () => {
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al liberar reserva');
        this.loading.set(false);
      },
    });
  }

  // ==================== TRANSACTIONS ====================
  loadTransactions(filters?: {
    productId?: string;
    warehouseId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getTransactionHistory(filters).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar transacciones');
        this.loading.set(false);
      },
    });
  }

  // ==================== ADJUSTMENTS ====================
  loadAdjustments(warehouseId?: string, status?: string) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAdjustments(warehouseId, status).subscribe({
      next: (data) => {
        this.adjustments.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar ajustes');
        this.loading.set(false);
      },
    });
  }

  loadAdjustment(id: string) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAdjustment(id).subscribe({
      next: (data) => {
        this.selectedAdjustment.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar ajuste');
        this.loading.set(false);
      },
    });
  }

  createAdjustment(
    dto: CreateAdjustmentDto,
    onSuccess?: (adjustment: InventoryAdjustment) => void
  ) {
    this.loading.set(true);
    this.error.set(null);

    this.api.createAdjustment(dto).subscribe({
      next: (adjustment) => {
        this.adjustments.update((prev) => [adjustment, ...prev]);
        this.loading.set(false);
        onSuccess?.(adjustment);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al crear ajuste');
        this.loading.set(false);
      },
    });
  }

  approveAdjustment(id: string, onSuccess?: () => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.approveAdjustment(id).subscribe({
      next: (updated) => {
        this.adjustments.update((prev) => prev.map((a) => (a.id === id ? updated : a)));
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al aprobar ajuste');
        this.loading.set(false);
      },
    });
  }

  cancelAdjustment(id: string, onSuccess?: () => void) {
    this.loading.set(true);
    this.error.set(null);

    this.api.cancelAdjustment(id).subscribe({
      next: () => {
        this.adjustments.update((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a))
        );
        this.loading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cancelar ajuste');
        this.loading.set(false);
      },
    });
  }

  // ==================== FILTERS ====================
  setWarehouseFilter(warehouseId: string | null) {
    this.warehouseFilter.set(warehouseId);
  }

  setProductFilter(productId: string | null) {
    this.productFilter.set(productId);
  }

  setStatusFilter(status: string | null) {
    this.statusFilter.set(status);
  }

  reset() {
    this.inventory.set([]);
    this.transactions.set([]);
    this.adjustments.set([]);
    this.selectedAdjustment.set(null);
    this.availableStock.set(0);
    this.loading.set(false);
    this.error.set(null);
    this.warehouseFilter.set(null);
    this.productFilter.set(null);
    this.statusFilter.set(null);
  }
}
