import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../app/auth/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }

  @Get('ready')
  ready() {
    return this.healthService.readiness();
  }

  @Get('live')
  live() {
    return this.healthService.liveness();
  }
}
