import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersStateService } from './services/users.state.service';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { PasswordModalComponent } from './components/password-modal/password-modal.component';
import { ICreateUser, IUpdateUser, IUserSummary } from '@cadena24-wms/shared';

type PageMode = 'list' | 'create' | 'edit';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, UserListComponent, UserFormComponent, PasswordModalComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent implements OnInit {
  readonly state = inject(UsersStateService);

  readonly mode = signal<PageMode>('list');
  readonly editingUserId = signal<number | null>(null);

  ngOnInit(): void {
    this.state.loadUsers();
  }

  // ── Mode transitions ───────────────────────────────────────────────────────

  showCreate(): void {
    this.state.clearSelected();
    this.state.clearError();
    this.editingUserId.set(null);
    this.mode.set('create');
  }

  showEdit(user: IUserSummary): void {
    this.state.loadUser(user.id);
    this.editingUserId.set(user.id);
    this.mode.set('edit');
  }

  showList(): void {
    this.state.clearSelected();
    this.state.clearError();
    this.mode.set('list');
  }

  // ── Form callbacks ─────────────────────────────────────────────────────────

  onCreateSaved(dto: ICreateUser | IUpdateUser): void {
    this.state.createUser(dto as ICreateUser, () => this.showList());
  }

  onEditSaved(dto: ICreateUser | IUpdateUser): void {
    const id = this.editingUserId();
    if (!id) return;
    this.state.updateUser(id, dto as IUpdateUser, () => this.showList());
  }

  onCancelled(): void {
    this.showList();
  }
}
