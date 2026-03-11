import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  async getKPIs() {
    return this.dashboardService.getKPIs();
  }

  @Get('stock-by-category')
  async getStockByCategory() {
    return this.dashboardService.getStockByCategory();
  }

  @Get('daily-movements')
  async getDailyMovements(@Query('days') days = 30) {
    return this.dashboardService.getDailyMovements(Number(days));
  }

  @Get('top-products')
  async getTopProducts(@Query('limit') limit = 10) {
    return this.dashboardService.getTopProducts(Number(limit));
  }

  @Get('orders-by-status')
  async getOrdersByStatus() {
    return this.dashboardService.getOrdersByStatus();
  }

  @Get('warehouse-occupancy')
  async getWarehouseOccupancy() {
    return this.dashboardService.getWarehouseOccupancy();
  }
}
