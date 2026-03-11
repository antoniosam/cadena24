import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Inventory,
  InventoryTransaction,
  InventoryAdjustment,
  ReserveInventoryDto,
  ReleaseReservationDto,
  CreateAdjustmentDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wms/inventory`;

  getInventory(filters?: {
    productId?: string;
    locationId?: string;
    warehouseId?: string;
    status?: string;
  }): Observable<Inventory[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params = params.set(key, value);
      });
    }

    return this.http.get<Inventory[]>(this.apiUrl, { params });
  }

  getAvailableStock(productId: string, warehouseId?: string): Observable<number> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);

    return this.http.get<number>(`${this.apiUrl}/available/${productId}`, { params });
  }

  getStockByProduct(productId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/product/${productId}`);
  }

  getStockByLocation(locationId: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/location/${locationId}`);
  }

  reserveInventory(data: ReserveInventoryDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reserve`, data);
  }

  releaseReservation(data: ReleaseReservationDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/release`, data);
  }

  getTransactionHistory(filters?: {
    productId?: string;
    warehouseId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }): Observable<InventoryTransaction[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const paramValue = value instanceof Date ? value.toISOString() : value.toString();
          params = params.set(key, paramValue);
        }
      });
    }

    return this.http.get<InventoryTransaction[]>(`${this.apiUrl}/transactions`, { params });
  }

  createAdjustment(data: CreateAdjustmentDto): Observable<InventoryAdjustment> {
    return this.http.post<InventoryAdjustment>(`${this.apiUrl}/adjustments`, data);
  }

  getAdjustments(warehouseId?: string, status?: string): Observable<InventoryAdjustment[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (status) params = params.set('status', status);

    return this.http.get<InventoryAdjustment[]>(`${this.apiUrl}/adjustments`, { params });
  }

  getAdjustment(id: string): Observable<InventoryAdjustment> {
    return this.http.get<InventoryAdjustment>(`${this.apiUrl}/adjustments/${id}`);
  }

  approveAdjustment(id: string): Observable<InventoryAdjustment> {
    return this.http.patch<InventoryAdjustment>(`${this.apiUrl}/adjustments/${id}/approve`, {});
  }

  cancelAdjustment(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/adjustments/${id}/cancel`, {});
  }
}
