import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardKPIs,
  StockByCategory,
  DailyMovements,
  TopProducts,
  OrdersByStatus,
  WarehouseOccupancy,
  ApiResponse,
} from '@cadena24-wms/shared';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dashboard';

  getKPIs(): Observable<DashboardKPIs> {
    return this.http.get<DashboardKPIs>(`${this.apiUrl}/kpis`);
  }

  getStockByCategory(): Observable<StockByCategory[]> {
    return this.http.get<StockByCategory[]>(`${this.apiUrl}/stock-by-category`);
  }

  getDailyMovements(days = 30): Observable<DailyMovements[]> {
    return this.http.get<DailyMovements[]>(`${this.apiUrl}/daily-movements?days=${days}`);
  }

  getTopProducts(limit = 10): Observable<TopProducts[]> {
    return this.http.get<TopProducts[]>(`${this.apiUrl}/top-products?limit=${limit}`);
  }

  getOrdersByStatus(): Observable<OrdersByStatus[]> {
    return this.http.get<OrdersByStatus[]>(`${this.apiUrl}/orders-by-status`);
  }

  getWarehouseOccupancy(): Observable<WarehouseOccupancy> {
    return this.http.get<WarehouseOccupancy>(`${this.apiUrl}/warehouse-occupancy`);
  }
}
