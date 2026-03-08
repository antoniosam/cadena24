import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Product, CreateProductDto } from '@cadena24-wms/shared';
import { ProductsApiService } from './products-api.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsStateService {
  private api = inject(ProductsApiService);

  // State
  products = signal<Product[]>([]);
  selectedProduct = signal<Product | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // Filters
  searchTerm = signal<string>('');
  categoryFilter = signal<string | null>(null);
  activeFilter = signal<boolean | null>(null);
  lowStockFilter = signal<boolean>(false);

  // Computed
  hasProducts = computed(() => this.products().length > 0);
  hasError = computed(() => this.error() !== null);

  loadProducts() {
    this.loading.set(true);
    this.error.set(null);

    const filters = {
      search: this.searchTerm() || undefined,
      category: this.categoryFilter() || undefined,
      isActive: this.activeFilter() ?? undefined,
      lowStock: this.lowStockFilter() || undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getProducts(filters).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar productos';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadProduct(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProduct(id).subscribe({
      next: (product) => {
        this.selectedProduct.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar producto';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadProducts();
  }

  setCategory(category: string | null) {
    this.categoryFilter.set(category);
    this.currentPage.set(1);
    this.loadProducts();
  }

  setActiveFilter(isActive: boolean | null) {
    this.activeFilter.set(isActive);
    this.currentPage.set(1);
    this.loadProducts();
  }

  setLowStockFilter(lowStock: boolean) {
    this.lowStockFilter.set(lowStock);
    this.currentPage.set(1);
    this.loadProducts();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadProducts();
  }

  createProduct(dto: CreateProductDto): Observable<Product> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.createProduct(dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.loadProducts();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  updateProduct(id: number, dto: Partial<CreateProductDto>): Observable<Product> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.updateProduct(id, dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  deleteProduct(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.deleteProduct(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadProducts();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message);
        this.loading.set(false);
      },
    });
  }

  toggleActive(id: number, isActive: boolean): void {
    this.api.updateProduct(id, { isActive }).subscribe({
      next: () => {
        this.products.update((list) => list.map((p) => (p.id === id ? { ...p, isActive } : p)));
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message);
      },
    });
  }

  reset() {
    this.products.set([]);
    this.selectedProduct.set(null);
    this.error.set(null);
    this.searchTerm.set('');
    this.categoryFilter.set(null);
    this.activeFilter.set(null);
    this.lowStockFilter.set(false);
    this.currentPage.set(1);
  }
}
