import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Classification,
  CreateClassificationDto,
  UpdateClassificationDto,
  ClassificationQueryDto,
} from '@cadena24-wms/shared';
import { ClassificationsApiService } from './classifications-api.service';

@Injectable({
  providedIn: 'root',
})
export class ClassificationsStateService {
  private api = inject(ClassificationsApiService);

  // State
  classifications = signal<Classification[]>([]);
  selectedClassification = signal<Classification | null>(null);
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
  hasClassifications = computed(() => this.classifications().length > 0);
  hasError = computed(() => this.error() !== null);

  loadClassifications() {
    this.loading.set(true);
    this.error.set(null);

    const filters: ClassificationQueryDto = {
      search: this.searchTerm() || undefined,
      isActive: this.activeFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getClassifications(filters).subscribe({
      next: (response) => {
        this.classifications.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar clasificaciones';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadClassification(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getClassification(id).subscribe({
      next: (classification) => {
        this.selectedClassification.set(classification);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cargar clasificación';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setSearchTerm(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadClassifications();
  }

  setActiveFilter(isActive: boolean | null) {
    this.activeFilter.set(isActive);
    this.currentPage.set(1);
    this.loadClassifications();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadClassifications();
  }

  createClassification(dto: CreateClassificationDto): Observable<Classification> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.createClassification(dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.loadClassifications();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  updateClassification(id: number, dto: UpdateClassificationDto): Observable<Classification> {
    this.loading.set(true);
    this.error.set(null);
    return this.api.updateClassification(id, dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.loadClassifications();
        },
        error: (err) => {
          this.error.set(err.error?.message ?? err.message);
          this.loading.set(false);
        },
      })
    );
  }

  deleteClassification(id: number): void {
    if (!confirm('¿Estás seguro de que deseas desactivar esta clasificación?')) return;

    this.loading.set(true);
    this.error.set(null);
    this.api.deleteClassification(id).subscribe({
      next: () => {
        this.loading.set(false);
        this.loadClassifications();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? err.message);
        this.loading.set(false);
      },
    });
  }

  reset() {
    this.classifications.set([]);
    this.selectedClassification.set(null);
    this.error.set(null);
    this.searchTerm.set('');
    this.activeFilter.set(null);
    this.currentPage.set(1);
  }
}
