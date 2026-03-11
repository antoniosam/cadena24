import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Provider,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from '@cadena24-wms/shared';
import { ProvidersApiService } from './providers-api.service';

@Injectable({
  providedIn: 'root',
})
export class ProvidersStateService {
  private api = inject(ProvidersApiService);

  // State
  providers = signal<Provider[]>([]);
  selectedProvider = signal<Provider | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // Filters
  searchTerm = signal<string>('');
  activeFilter = signal<boolean | null>(null);

  // Computed
  hasProviders = computed(() => this.providers().length > 0);
  hasError = computed(() => this.error() !== null);

  loadProviders() {
    this.loading.set(true);
    this.error.set(null);

    const filters: ProviderQueryDto = {
      search: this.searchTerm() || undefined,
      isActive: this.activeFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getProviders(filters).subscribe({
      next: (response) => {
        this.providers.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar proveedores';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadProvider(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProvider(id).subscribe({
      next: (provider) => {
        this.selectedProvider.set(provider);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar proveedor';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadProviders();
  }

  setActiveFilter(isActive: boolean | null) {
    this.activeFilter.set(isActive);
    this.currentPage.set(1);
    this.loadProviders();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadProviders();
  }

  createProvider(dto: CreateProviderDto): Observable<Provider> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.createProvider(dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.loadProviders();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  updateProvider(id: number, dto: UpdateProviderDto): Observable<Provider> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.updateProvider(id, dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.loadProviders();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  deleteProvider(id: number): void {
    if (!confirm('¿Estás seguro de que deseas desactivar este proveedor?')) return;

    this.loading.set(true);
    this.error.set(null);
    this.api.deleteProvider(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadProviders();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message);
        this.loading.set(false);
      },
    });
  }

  reset() {
    this.providers.set([]);
    this.selectedProvider.set(null);
    this.error.set(null);
    this.searchTerm.set('');
    this.activeFilter.set(null);
    this.currentPage.set(1);
  }
}
