import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Location,
  CreateLocationDto,
  UpdateLocationDto,
  QueryLocationDto,
  LocationTreeNode,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

export interface LocationsResponse {
  items: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/locations`;

  getAll(filters?: QueryLocationDto): Observable<LocationsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<LocationsResponse>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`);
  }

  getByBarcode(barcode: string): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/barcode/${barcode}`);
  }

  getWarehouseTree(warehouseId: number): Observable<LocationTreeNode[]> {
    return this.http.get<LocationTreeNode[]>(`${this.apiUrl}/warehouse/${warehouseId}/tree`);
  }

  getByProduct(productId: number, warehouseId?: number): Observable<Location[]> {
    let params = new HttpParams();
    if (warehouseId !== undefined) {
      params = params.set('warehouseId', warehouseId.toString());
    }
    return this.http.get<Location[]>(`${this.apiUrl}/by-product/${productId}`, { params });
  }

  create(data: CreateLocationDto): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, data);
  }

  update(id: number, data: UpdateLocationDto): Observable<Location> {
    return this.http.patch<Location>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
