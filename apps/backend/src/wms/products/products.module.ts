import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { PrismaModule } from '../../app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
