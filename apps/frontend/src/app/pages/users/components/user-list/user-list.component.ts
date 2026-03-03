import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IUserSummary, ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent {
  @Input() users: IUserSummary[] = [];
  @Input() pagination: PaginationState | null = null;

  @Output() editUser = new EventEmitter<IUserSummary>();
  @Output() deleteUser = new EventEmitter<number>();
  @Output() toggleStatus = new EventEmitter<number>();
  @Output() openPasswordModal = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  readonly roleLabels = ROLE_LABELS;
  readonly RoleCode = RoleCode;

  onEdit(user: IUserSummary): void {
    this.editUser.emit(user);
  }

  onToggleStatus(id: number): void {
    this.toggleStatus.emit(id);
  }

  onPasswordModal(id: number): void {
    this.openPasswordModal.emit(id);
  }

  onDelete(user: IUserSummary): void {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar a ${user.firstName} ${user.lastName}?`
    );
    if (confirmed) {
      this.deleteUser.emit(user.id);
    }
  }

  goToPage(page: number): void {
    this.pageChange.emit(page);
  }

  getRoleBadgeClass(role: RoleCode): string {
    const map: Record<RoleCode, string> = {
      [RoleCode.ADMIN]: 'bg-danger',
      [RoleCode.MANAGER]: 'bg-warning text-dark',
      [RoleCode.USER]: 'bg-secondary',
    };
    return map[role] ?? 'bg-secondary';
  }

  getPagesArray(): number[] {
    if (!this.pagination) return [];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }
}
