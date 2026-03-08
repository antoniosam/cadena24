import { Module } from '@nestjs/common';
import { MovementController } from './movement.controller';
import { MovementService } from './movement.service';
import { MovementRepository } from './movement.repository';
import { PrismaModule } from '../../app/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [PrismaModule, InventoryModule, LocationsModule, ProductsModule],
  controllers: [MovementController],
  providers: [MovementService, MovementRepository],
  exports: [MovementService],
})
export class MovementModule {}
