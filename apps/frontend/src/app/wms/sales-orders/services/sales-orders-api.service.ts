import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SalesOrder,
  SalesOrdersResponse,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  UpdateSalesOrderPriorityDto,
  QuerySalesOrdersDto,
  ValidateStockDto,
  StockValidationResult,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SalesOrdersApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/sales-orders`;

  getSalesOrders(filters?: QuerySalesOrdersDto): Observable<SalesOrdersResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<SalesOrdersResponse>(this.apiUrl, { params });
  }

  getSalesOrder(id: number): Observable<SalesOrder> {
    return this.http.get<SalesOrder>(`${this.apiUrl}/${id}`);
  }

  createSalesOrder(data: CreateSalesOrderDto): Observable<SalesOrder> {
    return this.http.post<SalesOrder>(this.apiUrl, data);
  }

  updateSalesOrder(id: number, data: UpdateSalesOrderDto): Observable<SalesOrder> {
    return this.http.patch<SalesOrder>(`${this.apiUrl}/${id}`, data);
  }

  updatePriority(id: number, data: UpdateSalesOrderPriorityDto): Observable<SalesOrder> {
    return this.http.patch<SalesOrder>(`${this.apiUrl}/${id}/priority`, data);
  }

  cancelSalesOrder(id: number): Observable<SalesOrder> {
    return this.http.delete<SalesOrder>(`${this.apiUrl}/${id}`);
  }

  validateStock(data: ValidateStockDto): Observable<StockValidationResult> {
    return this.http.post<StockValidationResult>(`${this.apiUrl}/validate-stock`, data);
  }

  canPick(id: number): Observable<{
    canPick: boolean;
    orderId: number;
    orderNumber: string;
    status: string;
    pendingLines: number;
    reason?: string;
  }> {
    return this.http.get<{
      canPick: boolean;
      orderId: number;
      orderNumber: string;
      status: string;
      pendingLines: number;
      reason?: string;
    }>(`${this.apiUrl}/${id}/can-pick`);
  }

  reserveInventory(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}/reserve-inventory`,
      {}
    );
  }

  releaseInventory(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}/release-inventory`,
      {}
    );
  }
}
