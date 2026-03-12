import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { LocationsModule } from './locations/locations.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReceivingModule } from './receiving/receiving.module';
import { MovementModule } from './movement/movement.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { PickingModule } from './picking/picking.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { ClientsModule } from './clients/clients.module';
import { ProvidersModule } from './providers/providers.module';
import { ClassificationsModule } from './classifications/classifications.module';

@Module({
  imports: [
    ProductsModule,
    WarehousesModule,
    LocationsModule,
    InventoryModule,
    ReceivingModule,
    MovementModule,
    SalesOrdersModule,
    PickingModule,
    DashboardModule,
    AlertsModule,
    ReportsModule,
    ClientsModule,
    ProvidersModule,
    ClassificationsModule,
  ],
  exports: [
    ProductsModule,
    WarehousesModule,
    LocationsModule,
    InventoryModule,
    ReceivingModule,
    MovementModule,
    SalesOrdersModule,
    PickingModule,
    DashboardModule,
    AlertsModule,
    ReportsModule,
    ClientsModule,
    ProvidersModule,
    ClassificationsModule,
  ],
})
export class WmsModule {}
