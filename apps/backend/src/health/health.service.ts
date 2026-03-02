import { Injectable } from '@nestjs/common';
import { PrismaService } from '../app/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * General health check - returns application status and version
   */
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'cadena24-wms-backend',
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
    };
  }

  /**
   * Readiness probe - checks if the app is ready to accept traffic
   * Verifies database connectivity
   */
  async readiness() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'disconnected',
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Liveness probe - checks if the app is alive
   * Simple check to verify the process is running
   */
  liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
