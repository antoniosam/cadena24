import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

export interface WarehousesResponse {
  items: Warehouse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class WarehousesApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/warehouses`;

  getAll(filters?: QueryWarehouseDto): Observable<WarehousesResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<WarehousesResponse>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
  }

  getPrimary(): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/primary`);
  }

  create(data: CreateWarehouseDto): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.apiUrl, data);
  }

  update(id: number, data: UpdateWarehouseDto): Observable<Warehouse> {
    return this.http.patch<Warehouse>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
