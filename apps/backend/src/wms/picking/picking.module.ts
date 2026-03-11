import { Module } from '@nestjs/common';
import { PickingController } from './picking.controller';
import { PickingService } from './picking.service';
import { PickingRepository } from './picking.repository';
import { PrismaModule } from '../../app/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [PickingController],
  providers: [PickingService, PickingRepository],
  exports: [PickingService],
})
export class PickingModule {}
