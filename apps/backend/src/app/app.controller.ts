import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from '@cadena24-wms/shared';
import { Public } from './auth/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): ApiResponse<{ status: string; version: string }> {
    return this.appService.getHealth();
  }
}
