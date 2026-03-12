import { Module } from '@nestjs/common';
import { ClassificationsService } from './classifications.service';
import { ClassificationsController } from './classifications.controller';
import { ClassificationsRepository } from './classifications.repository';
import { PrismaModule } from '../../app/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClassificationsController],
  providers: [ClassificationsService, ClassificationsRepository],
  exports: [ClassificationsService],
})
export class ClassificationsModule {}
