import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MovementOrder,
  MovementOrdersResponse,
  CreateMovementOrderDto,
  ExecuteMovementLineDto,
  ValidateMovementDto,
  SuggestLocationDto,
  QueryMovementOrderDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MovementApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/wms/movement-orders`;

  getMovementOrders(filters?: QueryMovementOrderDto): Observable<MovementOrdersResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<MovementOrdersResponse>(this.apiUrl, { params });
  }

  getMovementOrder(id: number): Observable<MovementOrder> {
    return this.http.get<MovementOrder>(`${this.apiUrl}/${id}`);
  }

  createMovementOrder(data: CreateMovementOrderDto): Observable<MovementOrder> {
    return this.http.post<MovementOrder>(this.apiUrl, data);
  }

  startExecution(id: number): Observable<MovementOrder> {
    return this.http.patch<MovementOrder>(`${this.apiUrl}/${id}/start`, {});
  }

  executeLine(orderId: number, data: ExecuteMovementLineDto): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${orderId}/execute-line`, data);
  }

  completeMovementOrder(id: number): Observable<MovementOrder> {
    return this.http.patch<MovementOrder>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancelMovementOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  validateMovement(data: ValidateMovementDto): Observable<{ valid: boolean; message: string }> {
    return this.http.post<{ valid: boolean; message: string }>(`${this.apiUrl}/validate`, data);
  }

  suggestLocation(data: SuggestLocationDto): Observable<{ location: unknown; strategy: string }> {
    return this.http.post<{ location: unknown; strategy: string }>(
      `${this.apiUrl}/suggest-location`,
      data
    );
  }
}
