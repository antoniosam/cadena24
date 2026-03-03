import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { PasswordService } from './password.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordService],
  exports: [UsersRepository, PasswordService],
})
export class UsersModule {}
