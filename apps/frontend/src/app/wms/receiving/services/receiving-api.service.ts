import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ReceivingOrder,
  ReceivingOrdersResponse,
  CreateReceivingOrderDto,
  ReceiveLineDto,
  QueryReceivingOrderDto,
  DamagedItem,
  QueryDamagedItemsDto,
  Location,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReceivingApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/receiving-orders`;

  getNewPurchaseOrderNumber(): Observable<{ suggest: string }> {
    return this.http.get<{ suggest: string }>(`${this.apiUrl}/generate-purchase-order-number`);
  }

  getReceivingOrders(filters?: QueryReceivingOrderDto): Observable<ReceivingOrdersResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ReceivingOrdersResponse>(this.apiUrl, { params });
  }

  getFilteredProductsForUser(orderId: number, userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${orderId}/filtered-products/${userId}`);
  }

  getLocationsForUser(classificationId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/wms/locations/by-classification/${classificationId}`
    );
  }

  getReceivingOrder(id: number): Observable<ReceivingOrder> {
    return this.http.get<ReceivingOrder>(`${this.apiUrl}/${id}`);
  }

  getReceivingLocations(orderId: number): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/${orderId}/receiving-locations`);
  }

  createReceivingOrder(data: CreateReceivingOrderDto): Observable<ReceivingOrder> {
    return this.http.post<ReceivingOrder>(this.apiUrl, data);
  }

  startReceiving(id: number): Observable<ReceivingOrder> {
    return this.http.patch<ReceivingOrder>(`${this.apiUrl}/${id}/start`, {});
  }

  receiveLine(orderId: number, data: Omit<ReceiveLineDto, 'receivingOrderId'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/${orderId}/receive-line`, data);
  }

  completeReceiving(id: number): Observable<ReceivingOrder> {
    return this.http.patch<ReceivingOrder>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancelReceivingOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  assignUser(orderId: number, userId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/assign-user/${userId}`, {});
  }

  getDamagedItems(filters?: QueryDamagedItemsDto): Observable<DamagedItem[]> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<DamagedItem[]>(`${this.apiUrl}/damaged-items`, { params });
  }
}
