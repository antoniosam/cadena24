import { Injectable, signal, computed, inject } from '@angular/core';
import { Client, QueryClientsDto, CreateClientDto, UpdateClientDto } from '@cadena24-wms/shared';
import { ClientsApiService } from './clients-api.service';

@Injectable({
  providedIn: 'root',
})
export class ClientsStateService {
  public api = inject(ClientsApiService);

  // ── State ──────────────────────────────────────────────────────────────────
  clients = signal<Client[]>([]);
  selectedClient = signal<Client | null>(null);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  total = signal<number>(0);

  // ── Filters ────────────────────────────────────────────────────────────────
  searchFilter = signal<string | null>(null);
  isActiveFilter = signal<boolean | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────
  hasClients = computed(() => this.clients().length > 0);
  hasError = computed(() => this.error() !== null);

  // ── Load all ───────────────────────────────────────────────────────────────
  loadClients() {
    this.loading.set(true);
    this.error.set(null);

    const filters: QueryClientsDto = {
      search: this.searchFilter() ?? undefined,
      isActive: this.isActiveFilter() ?? undefined,
      page: this.currentPage(),
      limit: 20,
    };

    this.api.getClients(filters).subscribe({
      next: (response) => {
        this.clients.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar clientes');
        this.loading.set(false);
      },
    });
  }

  // ── Load one ───────────────────────────────────────────────────────────────
  loadClient(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.api.getClient(id).subscribe({
      next: (client) => {
        this.selectedClient.set(client);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cargar el cliente');
        this.loading.set(false);
      },
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  createClient(
    dto: CreateClientDto,
    onSuccess: (client: Client) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.createClient(dto).subscribe({
      next: (client) => {
        this.saving.set(false);
        this.loadClients(); // Refresh list
        onSuccess(client);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al crear el cliente';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  updateClient(
    id: number,
    dto: UpdateClientDto,
    onSuccess?: (client: Client) => void,
    onError?: (msg: string) => void
  ) {
    this.saving.set(true);
    this.error.set(null);

    this.api.updateClient(id, dto).subscribe({
      next: (client) => {
        this.updateClientInList(client);
        this.saving.set(false);
        onSuccess?.(client);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Error al actualizar el cliente';
        this.error.set(msg);
        this.saving.set(false);
        onError?.(msg);
      },
    });
  }

  // ── Status ─────────────────────────────────────────────────────────────────
  setStatus(id: number, isActive: boolean, onSuccess?: () => void) {
    this.api.setStatus(id, isActive).subscribe({
      next: (client) => {
        this.updateClientInList(client);
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Error al cambiar estado');
      },
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  setSearchFilter(search: string | null) {
    this.searchFilter.set(search);
    this.currentPage.set(1);
    this.loadClients();
  }

  setIsActiveFilter(isActive: boolean | null) {
    this.isActiveFilter.set(isActive);
    this.currentPage.set(1);
    this.loadClients();
  }

  setPage(page: number) {
    this.currentPage.set(page);
    this.loadClients();
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  clearError() {
    this.error.set(null);
  }

  reset() {
    this.searchFilter.set(null);
    this.isActiveFilter.set(null);
    this.currentPage.set(1);
    this.loadClients();
  }

  clearSelectedClient() {
    this.selectedClient.set(null);
  }

  private updateClientInList(updatedClient: Client) {
    const clients = this.clients();
    const index = clients.findIndex((c) => c.id === updatedClient.id);
    if (index !== -1) {
      const updated = [...clients];
      updated[index] = updatedClient;
      this.clients.set(updated);
    }
    if (this.selectedClient()?.id === updatedClient.id) {
      this.selectedClient.set(updatedClient);
    }
  }
}
