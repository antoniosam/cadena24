import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getKPIs() {
    return this.dashboardRepository.getKPIs();
  }

  async getStockByCategory() {
    return this.dashboardRepository.getStockByCategory();
  }

  async getDailyMovements(days: number) {
    return this.dashboardRepository.getDailyMovements(days);
  }

  async getTopProducts(limit: number) {
    return this.dashboardRepository.getTopProducts(limit);
  }

  async getOrdersByStatus() {
    return this.dashboardRepository.getOrdersByStatus();
  }

  async getWarehouseOccupancy() {
    return this.dashboardRepository.getWarehouseOccupancy();
  }
}
