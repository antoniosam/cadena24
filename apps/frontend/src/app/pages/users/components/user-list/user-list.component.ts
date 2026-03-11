import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IUserSummary, ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';
import { UsersStateService } from '../../services/users.state.service';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

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
export class UserListComponent implements OnInit, OnDestroy {
  @Input() users: IUserSummary[] = [];
  @Input() pagination: PaginationState | null = null;

  @Output() editUser = new EventEmitter<IUserSummary>();
  @Output() deleteUser = new EventEmitter<number>();
  @Output() toggleStatus = new EventEmitter<number>();
  @Output() openPasswordModal = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  protected state = inject(UsersStateService);
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  readonly roleLabels = ROLE_LABELS;
  readonly RoleCode = RoleCode;

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.state.setSearchTerm(term);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

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

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  clearFilters(): void {
    this.searchSubject.next('');
    this.state.setSearchTerm('');
  }

  goToPage(page: number): void {
    this.pageChange.emit(page);
  }

  getRoleBadgeClass(role: RoleCode): string {
    const map: Record<RoleCode, string> = {
      [RoleCode.ADMIN]: 'bg-danger-soft',
      [RoleCode.MANAGER]: 'bg-warning-soft',
      [RoleCode.USER]: 'bg-primary-soft',
    };
    return map[role] ?? 'bg-primary-soft';
  }

  getPagesArray(): number[] {
    if (!this.pagination) return [];
    return Array.from({ length: this.pagination.totalPages }, (_, i) => i + 1);
  }
}
