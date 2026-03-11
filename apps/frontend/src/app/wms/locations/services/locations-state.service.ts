import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  LocationTreeNode,
} from '@cadena24-wms/shared';
import { LocationsApiService } from './locations-api.service';

@Injectable({
  providedIn: 'root',
})
export class LocationsStateService {
  private api = inject(LocationsApiService);

  // State
  locations = signal<Location[]>([]);
  selectedLocation = signal<Location | null>(null);
  locationTree = signal<LocationTreeNode[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // Filters
  searchTerm = signal<string>('');
  warehouseFilter = signal<number | null>(null);
  zoneFilter = signal<string | null>(null);
  typeFilter = signal<'receiving' | 'storage' | 'picking' | 'shipping' | null>(null);
  availableOnlyFilter = signal<boolean>(false);
  activeFilter = signal<boolean | null>(null);

  // Computed
  hasLocations = computed(() => this.locations().length > 0);
  hasError = computed(() => this.error() !== null);

  loadLocations() {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      search: this.searchTerm() || undefined,
      warehouseId: this.warehouseFilter() ?? undefined,
      zone: this.zoneFilter() || undefined,
      type: this.typeFilter() || undefined,
      availableOnly: this.availableOnlyFilter() || undefined,
      isActive: this.activeFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getAll(filters).subscribe({
      next: (response) => {
        this.locations.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar ubicaciones');
        this.loading.set(false);
      },
    });
  }

  loadLocation(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getOne(id).subscribe({
      next: (location) => {
        this.selectedLocation.set(location);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar ubicación');
        this.loading.set(false);
      },
    });
  }

  loadLocationTree(warehouseId: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getWarehouseTree(warehouseId).subscribe({
      next: (tree) => {
        this.locationTree.set(tree);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar árbol de ubicaciones');
        this.loading.set(false);
      },
    });
  }

  createLocation(data: CreateLocationDto): Observable<Location> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.create(data).pipe(
      tap(() => {
        this.loadLocations();
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message || 'Error al crear ubicación');
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updateLocation(id: number, data: UpdateLocationDto): Observable<Location> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.update(id, data).pipe(
      tap(() => {
        this.loadLocations();
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message || 'Error al actualizar ubicación');
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteLocation(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.delete(id).pipe(
      tap(() => {
        this.loadLocations();
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message || 'Error al eliminar ubicación');
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setWarehouseFilter(warehouseId: number | null) {
    this.warehouseFilter.set(warehouseId);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setZoneFilter(zone: string | null) {
    this.zoneFilter.set(zone);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setTypeFilter(type: 'receiving' | 'storage' | 'picking' | 'shipping' | null) {
    this.typeFilter.set(type);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setAvailableOnlyFilter(availableOnly: boolean) {
    this.availableOnlyFilter.set(availableOnly);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setActiveFilter(isActive: boolean | null) {
    this.activeFilter.set(isActive);
    this.currentPage.set(1);
    this.loadLocations();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadLocations();
  }

  reset() {
    this.locations.set([]);
    this.selectedLocation.set(null);
    this.locationTree.set([]);
    this.error.set(null);
    this.searchTerm.set('');
    this.warehouseFilter.set(null);
    this.zoneFilter.set(null);
    this.typeFilter.set(null);
    this.availableOnlyFilter.set(false);
    this.activeFilter.set(null);
    this.currentPage.set(1);
  }
}
