import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStateService } from '../../pages/login/services/auth-state.service';
import { ROLE_LABELS, RoleCode } from '@cadena24-wms/shared';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class TopbarComponent {
  readonly authState = inject(AuthStateService);
  readonly isUserMenuOpen = signal(false);
  readonly ROLE_LABELS = ROLE_LABELS;

  /**
   * Extract initials from user's full name
   * Example: "John Doe" → "JD"
   */
  getUserInitials(): string {
    const name = this.authState.userName();
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get translated role label
   */
  getRoleLabel(): string {
    const role = this.authState.userRole();
    return role ? this.ROLE_LABELS[role] : 'Usuario';
  }

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen.update((value) => !value);
  }

  /**
   * Close user dropdown menu
   */
  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  /**
   * Handle logout action
   */
  onLogout(): void {
    this.closeUserMenu();
    this.authState.logout();
  }

  /**
   * Close menu when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenu = target.closest('.topbar-user-area');

    if (!userMenu && this.isUserMenuOpen()) {
      this.closeUserMenu();
    }
  }
}
