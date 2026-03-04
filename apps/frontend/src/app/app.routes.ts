import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout.component';

export const appRoutes: Routes = [
  // ── Public routes (no guard, no layout) ───────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Iniciar sesión — Cadena24 WMS',
  },

  // ── Protected routes (authGuard + layout wrapper) ─────────────────────────
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — Cadena24 WMS',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users-page.component').then((m) => m.UsersPageComponent),
        title: 'Usuarios — Cadena24 WMS',
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login',
  },
];
