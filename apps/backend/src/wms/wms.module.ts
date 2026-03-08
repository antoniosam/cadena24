import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { LocationsModule } from './locations/locations.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReceivingModule } from './receiving/receiving.module';
import { MovementModule } from './movement/movement.module';

@Module({
  imports: [
    ProductsModule,
    WarehousesModule,
    LocationsModule,
    InventoryModule,
    ReceivingModule,
    MovementModule,
  ],
  exports: [
    ProductsModule,
    WarehousesModule,
    LocationsModule,
    InventoryModule,
    ReceivingModule,
    MovementModule,
  ],
})
export class WmsModule {}
