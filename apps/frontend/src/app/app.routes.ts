import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/users/users-page.component').then((m) => m.UsersPageComponent),
    title: 'Usuarios — Cadena24 WMS',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
