import { computed, inject, Injectable, signal } from '@angular/core';
import { UsersService, UserQueryParams } from './users.service';
import {
  IChangePassword,
  ICreateUser,
  IUpdateUser,
  IUser,
  IUserSummary,
} from '@cadena24-wms/shared';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersStateService {
  private readonly usersService = inject(UsersService);

  // ── State signals ──────────────────────────────────────────────────────────
  readonly users = signal<IUserSummary[]>([]);
  readonly selectedUser = signal<IUser | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly pagination = signal<PaginationState | null>(null);

  // Password modal state
  readonly passwordModalOpen = signal<boolean>(false);
  readonly passwordModalUserId = signal<number | null>(null);
  readonly passwordSaving = signal<boolean>(false);
  readonly passwordError = signal<string | null>(null);

  // ── Computed signals ───────────────────────────────────────────────────────
  readonly activeUsers = computed(() => this.users().filter((u) => u.active));
  readonly inactiveUsers = computed(() => this.users().filter((u) => !u.active));
  readonly totalUsers = computed(() => this.pagination()?.total ?? 0);
  readonly hasNextPage = computed(() => this.pagination()?.hasNextPage ?? false);
  readonly hasPrevPage = computed(() => this.pagination()?.hasPreviousPage ?? false);

  // ── Actions ────────────────────────────────────────────────────────────────

  loadUsers(query?: UserQueryParams): void {
    this.loading.set(true);
    this.error.set(null);
    this.usersService.getAll(query).subscribe({
      next: (res) => {
        this.users.set(res.data ?? []);
        const p = res.pagination;
        this.pagination.set({
          ...p,
          hasNextPage: p.page < p.totalPages,
          hasPreviousPage: p.page > 1,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al cargar los usuarios');
        this.loading.set(false);
      },
    });
  }

  loadUser(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.usersService.getById(id).subscribe({
      next: (res) => {
        this.selectedUser.set(res.data ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al cargar el usuario');
        this.loading.set(false);
      },
    });
  }

  createUser(dto: ICreateUser, onSuccess?: () => void): void {
    this.saving.set(true);
    this.error.set(null);
    this.usersService.create(dto).subscribe({
      next: (res) => {
        const created = res.data;
        if (created) {
          this.users.update((list) => [
            ...list,
            {
              id: created.id,
              email: created.email,
              firstName: created.firstName,
              lastName: created.lastName,
              role: created.role,
              active: created.active,
            },
          ]);
        }
        this.saving.set(false);
        this.successMsg.set('Usuario creado correctamente');
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al crear el usuario');
        this.saving.set(false);
      },
    });
  }

  updateUser(id: number, dto: IUpdateUser, onSuccess?: () => void): void {
    this.saving.set(true);
    this.error.set(null);
    this.usersService.update(id, dto).subscribe({
      next: (res) => {
        const updated = res.data;
        if (updated) {
          this.users.update((list) =>
            list.map((u) =>
              u.id === id
                ? {
                    ...u,
                    email: updated.email,
                    firstName: updated.firstName,
                    lastName: updated.lastName,
                  }
                : u
            )
          );
          this.selectedUser.set(updated);
        }
        this.saving.set(false);
        this.successMsg.set('Usuario actualizado correctamente');
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al actualizar el usuario');
        this.saving.set(false);
      },
    });
  }

  toggleUserStatus(id: number): void {
    this.usersService.toggleStatus(id).subscribe({
      next: (res) => {
        const updated = res.data;
        if (updated) {
          this.users.update((list) =>
            list.map((u) => (u.id === id ? { ...u, active: updated.active } : u))
          );
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al cambiar el estado del usuario');
      },
    });
  }

  deleteUser(id: number, onSuccess?: () => void): void {
    this.usersService.delete(id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== id));
        this.successMsg.set('Usuario eliminado correctamente');
        onSuccess?.();
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Error al eliminar el usuario');
      },
    });
  }

  // ── Password modal actions ─────────────────────────────────────────────────

  openPasswordModal(userId: number): void {
    this.passwordModalUserId.set(userId);
    this.passwordError.set(null);
    this.passwordModalOpen.set(true);
  }

  closePasswordModal(): void {
    this.passwordModalOpen.set(false);
    this.passwordModalUserId.set(null);
    this.passwordError.set(null);
  }

  changePassword(dto: IChangePassword): void {
    const userId = this.passwordModalUserId();
    if (!userId) return;
    this.passwordSaving.set(true);
    this.passwordError.set(null);
    this.usersService.changePassword(userId, dto).subscribe({
      next: () => {
        this.passwordSaving.set(false);
        this.closePasswordModal();
        this.successMsg.set('Contraseña actualizada correctamente');
      },
      error: (err) => {
        this.passwordError.set(err?.error?.message ?? 'Error al cambiar la contraseña');
        this.passwordSaving.set(false);
      },
    });
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  clearError(): void {
    this.error.set(null);
  }

  clearSuccess(): void {
    this.successMsg.set(null);
  }

  clearSelected(): void {
    this.selectedUser.set(null);
  }
}
