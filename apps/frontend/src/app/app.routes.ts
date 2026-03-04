import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
