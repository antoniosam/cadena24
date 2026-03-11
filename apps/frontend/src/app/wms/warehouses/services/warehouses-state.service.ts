import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Warehouse, CreateWarehouseDto, UpdateWarehouseDto } from '@cadena24-wms/shared';
import { WarehousesApiService } from './warehouses-api.service';

@Injectable({
  providedIn: 'root',
})
export class WarehousesStateService {
  private api = inject(WarehousesApiService);

  // State
  warehouses = signal<Warehouse[]>([]);
  selectedWarehouse = signal<Warehouse | null>(null);
  primaryWarehouse = signal<Warehouse | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // Filters
  searchTerm = signal<string>('');
  activeFilter = signal<boolean | null>(null);
  primaryFilter = signal<boolean | null>(null);

  // Computed
  hasWarehouses = computed(() => this.warehouses().length > 0);
  hasError = computed(() => this.error() !== null);

  loadWarehouses() {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      search: this.searchTerm() || undefined,
      isActive: this.activeFilter() ?? undefined,
      isPrimary: this.primaryFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getAll(filters).subscribe({
      next: (response) => {
        this.warehouses.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar almacenes';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadWarehouse(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getOne(id).subscribe({
      next: (warehouse) => {
        this.selectedWarehouse.set(warehouse);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar almacén';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadPrimaryWarehouse() {
    this.loading.set(true);
    this.error.set(null);

    this.api.getPrimary().subscribe({
      next: (warehouse) => {
        this.primaryWarehouse.set(warehouse);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar almacén principal';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  createWarehouse(data: CreateWarehouseDto): Observable<Warehouse> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.create(data).pipe(
      tap(() => {
        this.loadWarehouses();
        this.loading.set(false);
      }),
      catchError((err) => {
        const msg = err.error?.message || err.message || 'Error al crear almacén';
        this.error.set(msg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updateWarehouse(id: number, data: UpdateWarehouseDto): Observable<Warehouse> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.update(id, data).pipe(
      tap(() => {
        this.loadWarehouses();
        this.loading.set(false);
      }),
      catchError((err) => {
        const msg = err.error?.message || err.message || 'Error al actualizar almacén';
        this.error.set(msg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteWarehouse(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.delete(id).pipe(
      tap(() => {
        this.loadWarehouses();
        this.loading.set(false);
      }),
      catchError((err) => {
        const msg = err.error?.message || err.message || 'Error al eliminar almacén';
        this.error.set(msg);
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadWarehouses();
  }

  setActiveFilter(isActive: boolean | null) {
    this.activeFilter.set(isActive);
    this.currentPage.set(1);
    this.loadWarehouses();
  }

  setPrimaryFilter(isPrimary: boolean | null) {
    this.primaryFilter.set(isPrimary);
    this.currentPage.set(1);
    this.loadWarehouses();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadWarehouses();
  }

  reset() {
    this.warehouses.set([]);
    this.selectedWarehouse.set(null);
    this.error.set(null);
    this.searchTerm.set('');
    this.activeFilter.set(null);
    this.primaryFilter.set(null);
    this.currentPage.set(1);
  }
}
