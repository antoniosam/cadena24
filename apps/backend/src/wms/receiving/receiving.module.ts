import { Module } from '@nestjs/common';
import { ReceivingController } from './receiving.controller';
import { ReceivingService } from './receiving.service';
import { ReceivingRepository } from './receiving.repository';
import { PrismaModule } from '../../app/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [PrismaModule, InventoryModule, LocationsModule],
  controllers: [ReceivingController],
  providers: [ReceivingService, ReceivingRepository],
  exports: [ReceivingService],
})
export class ReceivingModule {}
