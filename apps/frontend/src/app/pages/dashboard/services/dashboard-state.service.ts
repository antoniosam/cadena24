import { Injectable, inject, signal, computed } from '@angular/core';
import { DashboardService } from './dashboard.service';
import {
  DashboardKPIs,
  StockByCategory,
  DailyMovements,
  TopProducts,
  OrdersByStatus,
  WarehouseOccupancy,
} from '@cadena24-wms/shared';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardStateService {
  private dashboardService = inject(DashboardService);

  // Signals
  kpis = signal<DashboardKPIs | null>(null);
  stockByCategory = signal<StockByCategory[]>([]);
  dailyMovements = signal<DailyMovements[]>([]);
  topProducts = signal<TopProducts[]>([]);
  ordersByStatus = signal<OrdersByStatus[]>([]);
  warehouseOccupancy = signal<WarehouseOccupancy | null>(null);
  loading = signal<boolean>(false);

  loadAll() {
    this.loading.set(true);
    // Use Promise.all equivalent or just load sequentially for simplicity in this MVP
    this.dashboardService
      .getKPIs()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((data) => this.kpis.set(data));

    this.dashboardService.getStockByCategory().subscribe((data) => this.stockByCategory.set(data));

    this.dashboardService.getDailyMovements().subscribe((data) => this.dailyMovements.set(data));

    this.dashboardService.getTopProducts().subscribe((data) => this.topProducts.set(data));

    this.dashboardService.getOrdersByStatus().subscribe((data) => this.ordersByStatus.set(data));

    this.dashboardService
      .getWarehouseOccupancy()
      .subscribe((data) => this.warehouseOccupancy.set(data));
  }
}
