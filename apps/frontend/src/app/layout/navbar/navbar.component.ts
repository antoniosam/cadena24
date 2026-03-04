import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthStateService } from '../../pages/login/services/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  readonly authState = inject(AuthStateService);
  appTitle = 'Cadena24 WMS';
  isMenuCollapsed = true;

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  onLogout(): void {
    this.authState.logout();
  }
}
