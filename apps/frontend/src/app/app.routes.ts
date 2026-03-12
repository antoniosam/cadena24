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
      {
        path: 'wms/products',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/products/pages/product-list/product-list.component').then(
                (m) => m.ProductListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/products/pages/product-form/product-form.component').then(
                (m) => m.ProductFormComponent
              ),
            title: 'Nuevo Producto — Cadena24 WMS',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./wms/products/pages/product-form/product-form.component').then(
                (m) => m.ProductFormComponent
              ),
            title: 'Editar Producto — Cadena24 WMS',
          },
        ],
        title: 'Productos — Cadena24 WMS',
      },
      {
        path: 'wms/providers',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/providers/pages/provider-list/provider-list.component').then(
                (m) => m.ProviderListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/providers/pages/provider-form/provider-form.component').then(
                (m) => m.ProviderFormComponent
              ),
            title: 'Nuevo Proveedor — Cadena24 WMS',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./wms/providers/pages/provider-form/provider-form.component').then(
                (m) => m.ProviderFormComponent
              ),
            title: 'Editar Proveedor — Cadena24 WMS',
          },
        ],
        title: 'Proveedores — Cadena24 WMS',
      },
      {
        path: 'wms/classifications',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/classifications/pages/classification-list/classification-list.component').then(
                (m) => m.ClassificationListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/classifications/pages/classification-form/classification-form.component').then(
                (m) => m.ClassificationFormComponent
              ),
            title: 'Nueva Clasificación — Cadena24 WMS',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./wms/classifications/pages/classification-form/classification-form.component').then(
                (m) => m.ClassificationFormComponent
              ),
            title: 'Editar Clasificación — Cadena24 WMS',
          },
        ],
        title: 'Clasificaciones — Cadena24 WMS',
      },
      {
        path: 'wms/warehouses',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/warehouses/pages/warehouse-list/warehouse-list.component').then(
                (m) => m.WarehouseListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/warehouses/pages/warehouse-form/warehouse-form.component').then(
                (m) => m.WarehouseFormComponent
              ),
            title: 'Nuevo Almacén — Cadena24 WMS',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./wms/warehouses/pages/warehouse-form/warehouse-form.component').then(
                (m) => m.WarehouseFormComponent
              ),
            title: 'Editar Almacén — Cadena24 WMS',
          },
        ],
        title: 'Almacenes — Cadena24 WMS',
      },
      {
        path: 'wms/locations',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/locations/pages/location-list/location-list.component').then(
                (m) => m.LocationListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/locations/pages/location-form/location-form.component').then(
                (m) => m.LocationFormComponent
              ),
            title: 'Nueva Ubicación — Cadena24 WMS',
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('./wms/locations/pages/location-form/location-form.component').then(
                (m) => m.LocationFormComponent
              ),
            title: 'Editar Ubicación — Cadena24 WMS',
          },
        ],
        title: 'Ubicaciones — Cadena24 WMS',
      },
      {
        path: 'wms/clients',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/clients/pages/client-list/client-list.component').then(
                (m) => m.ClientListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/clients/pages/client-form/client-form.component').then(
                (m) => m.ClientFormComponent
              ),
            title: 'Nuevo Cliente — Cadena24 WMS',
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./wms/clients/pages/client-form/client-form.component').then(
                (m) => m.ClientFormComponent
              ),
            title: 'Editar Cliente — Cadena24 WMS',
          },
        ],
        title: 'Clientes — Cadena24 WMS',
      },
      {
        path: 'wms/inventory',
        loadComponent: () =>
          import('./wms/inventory/pages/inventory-list/inventory-list.component').then(
            (m) => m.InventoryListComponent
          ),
        title: 'Inventario — Cadena24 WMS',
      },
      {
        path: 'wms/movement',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/movement/pages/movement-list/movement-list.component').then(
                (m) => m.MovementListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/movement/pages/movement-create/movement-create.component').then(
                (m) => m.MovementCreateComponent
              ),
            title: 'Nueva Orden de Movimiento — Cadena24 WMS',
          },
          {
            path: ':id/execute',
            loadComponent: () =>
              import('./wms/movement/pages/movement-execute/movement-execute.component').then(
                (m) => m.MovementExecuteComponent
              ),
            title: 'Ejecutar Movimiento — Cadena24 WMS',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./wms/movement/pages/movement-execute/movement-execute.component').then(
                (m) => m.MovementExecuteComponent
              ),
            title: 'Detalle de Movimiento — Cadena24 WMS',
          },
        ],
        title: 'Movimientos — Cadena24 WMS',
      },
      {
        path: 'wms/sales-orders',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/sales-orders/pages/sales-order-list/sales-order-list.component').then(
                (m) => m.SalesOrderListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/sales-orders/pages/sales-order-create/sales-order-create.component').then(
                (m) => m.SalesOrderCreateComponent
              ),
            title: 'Nueva Orden de Venta — Cadena24 WMS',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./wms/sales-orders/pages/sales-order-detail/sales-order-detail.component').then(
                (m) => m.SalesOrderDetailComponent
              ),
            title: 'Detalle de Orden — Cadena24 WMS',
          },
        ],
        title: 'Órdenes de Venta — Cadena24 WMS',
      },
      {
        path: 'wms/picking',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/picking/pages/pick-list-list/pick-list-list.component').then(
                (m) => m.PickListListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./wms/picking/pages/pick-list-execute/pick-list-execute.component').then(
                (m) => m.PickListExecuteComponent
              ),
            title: 'Ejecutar Picking — Cadena24 WMS',
          },
        ],
        title: 'Picking — Cadena24 WMS',
      },
      {
        path: 'wms/receiving',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./wms/receiving/pages/receiving-list/receiving-list.component').then(
                (m) => m.ReceivingListComponent
              ),
            pathMatch: 'full',
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./wms/receiving/pages/receiving-create/receiving-create.component').then(
                (m) => m.ReceivingCreateComponent
              ),
            title: 'Nueva Orden de Recepción — Cadena24 WMS',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./wms/receiving/pages/receiving-process/receiving-process.component').then(
                (m) => m.ReceivingProcessComponent
              ),
            title: 'Detalle de Recepción — Cadena24 WMS',
          },
          {
            path: ':id/process',
            loadComponent: () =>
              import('./wms/receiving/pages/receiving-process/receiving-process.component').then(
                (m) => m.ReceivingProcessComponent
              ),
            title: 'Procesar Recepción — Cadena24 WMS',
          },
          {
            path: ':id/user-process',
            loadComponent: () =>
              import('./wms/receiving/pages/receiving-user-process/receiving-user-process.component').then(
                (m) => m.ReceivingUserProcessComponent
              ),
            title: 'Asignar Usuario a Recepción — Cadena24 WMS',
          },
          {
            path: 'damaged',
            loadComponent: () =>
              import('./wms/receiving/pages/damaged-review/damaged-review.component').then(
                (m) => m.DamagedReviewComponent
              ),
            title: 'Items Dañados — Cadena24 WMS',
          },
        ],
        title: 'Recepción — Cadena24 WMS',
      },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: 'login',
  },
];
