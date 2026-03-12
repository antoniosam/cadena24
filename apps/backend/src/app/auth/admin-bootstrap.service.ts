import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { RoleCode } from '@cadena24-wms/shared';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async onApplicationBootstrap() {
    const count = await this.usersRepository.count();
    if (count === 0) {
      this.logger.log('No users found. Creating admin user...');
      try {
        await this.usersRepository.create({
          email: 'admin@wms.com',
          firstName: 'Admin',
          lastName: 'WMS',
          password: '$2b$10$Dw21X6ZlMHxVYO0XPvys..gc55T0tYcLHDqYqrsmwRonjxEFUWpz6',
          role: 'ADMIN' as RoleCode,
        });
        this.logger.log('Admin user created successfully.');
      } catch (error) {
        this.logger.error('Failed to create admin user', error);
      }
    }
  }
}
