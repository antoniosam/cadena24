import { Controller, Get, Patch, Param } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts() {
    return this.alertsService.getAlerts();
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(Number(id));
  }
}
