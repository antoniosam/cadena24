import { Injectable, signal, computed, inject } from '@angular/core';
import {
  PickList,
  PickListStatus,
  GeneratePickListDto,
  AssignPickerDto,
  PickLineDto,
  QueryPickListsDto,
} from '@cadena24-wms/shared';
import { PickingApiService } from './picking-api.service';

@Injectable({
  providedIn: 'root',
})
export class PickingStateService {
  private api = inject(PickingApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  pickLists = signal<PickList[]>([]);
  selectedPickList = signal<PickList | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // ── Filters ────────────────────────────────────────────────────────────────
  statusFilter = signal<PickListStatus | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  hasPickLists = computed(() => this.pickLists().length > 0);
  hasError = computed(() => this.error() !== null);
  pendingPickLists = computed(() => this.pickLists().filter((pl) => pl.status === 'pending'));
  inProgressPickLists = computed(() =>
    this.pickLists().filter((pl) => pl.status === 'in_progress')
  );

  // ── Load all ───────────────────────────────────────────────────────────────
  loadPickLists(filters?: QueryPickListsDto) {
    this.loading.set(true);
    this.error.set(null);

    const query: QueryPickListsDto = {
      status: this.statusFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
      ...filters,
    };

    this.api.getPickLists(query).subscribe({
      next: (response) => {
        this.pickLists.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar pick lists');
        this.loading.set(false);
      },
    });
  }

  // ── Load one ───────────────────────────────────────────────────────────────
  loadPickList(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getPickList(id).subscribe({
      next: (pickList) => {
        this.selectedPickList.set(pickList);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar la pick list');
        this.loading.set(false);
      },
    });
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  generatePickList(
    dto: GeneratePickListDto,
    onSuccess: (pickList: PickList) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.generatePickList(dto).subscribe({
      next: (pickList) => {
        this.saving.set(false);
        onSuccess(pickList);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al generar pick list';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Assign picker ──────────────────────────────────────────────────────────
  assignPicker(
    id: number,
    dto: AssignPickerDto,
    onSuccess?: (pickList: PickList) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.assignPicker(id, dto).subscribe({
      next: (pickList) => {
        this.updatePickListInList(pickList);
        this.saving.set(false);
        onSuccess?.(pickList);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al asignar picker';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Start ──────────────────────────────────────────────────────────────────
  startPickList(
    id: number,
    onSuccess?: (pickList: PickList) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.start(id).subscribe({
      next: (pickList) => {
        this.selectedPickList.set(pickList);
        this.updatePickListInList(pickList);
        this.saving.set(false);
        onSuccess?.(pickList);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al iniciar pick list';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Pick line ──────────────────────────────────────────────────────────────
  pickLine(
    pickListId: number,
    dto: PickLineDto,
    onSuccess?: (result: {
      lineId: number;
      quantityPicked: number;
      status: string;
      isShort: boolean;
      missing: number;
    }) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.pickLine(pickListId, dto).subscribe({
      next: (result) => {
        // Reload pick list to get updated state
        this.loadPickList(pickListId);
        this.saving.set(false);
        onSuccess?.(result);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al registrar picking';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Complete ───────────────────────────────────────────────────────────────
  completePickList(
    id: number,
    onSuccess?: (pickList: PickList) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.complete(id).subscribe({
      next: (pickList) => {
        this.selectedPickList.set(pickList);
        this.updatePickListInList(pickList);
        this.saving.set(false);
        onSuccess?.(pickList);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al completar pick list';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Cancel ─────────────────────────────────────────────────────────────────
  cancelPickList(id: number, onSuccess?: () => void, onError?: (msg: string) => void) {
    this.api.cancel(id).subscribe({
      next: (pickList) => {
        this.updatePickListInList(pickList);
        if (this.selectedPickList()?.id === id) {
          this.selectedPickList.set(pickList);
        }
        onSuccess?.();
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al cancelar pick list';
        this.error.set(msg);
        onError?.(msg);
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  setStatusFilter(status: PickListStatus | null) {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadPickLists();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadPickLists();
  }

  clearFilters() {
    this.statusFilter.set(null);
    this.currentPage.set(1);
    this.loadPickLists();
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  clearError() {
    this.error.set(null);
  }

  clearSelectedPickList() {
    this.selectedPickList.set(null);
  }

  updatePickListInList(updated: PickList) {
    const list = this.pickLists();
    const index = list.findIndex((pl) => pl.id === updated.id);
    if (index !== -1) {
      const copy = [...list];
      copy[index] = updated;
      this.pickLists.set(copy);
    }
    if (this.selectedPickList()?.id === updated.id) {
      this.selectedPickList.set(updated);
    }
  }
}
