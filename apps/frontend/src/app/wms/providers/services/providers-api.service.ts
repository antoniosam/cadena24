import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Provider,
  ProvidersResponse,
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProvidersApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/providers`;

  getProviders(filters?: ProviderQueryDto): Observable<ProvidersResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ProvidersResponse>(this.apiUrl, { params });
  }

  getProvider(id: number): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  createProvider(data: CreateProviderDto): Observable<Provider> {
    return this.http.post<Provider>(this.apiUrl, data);
  }

  updateProvider(id: number, data: UpdateProviderDto): Observable<Provider> {
    return this.http.patch<Provider>(`${this.apiUrl}/${id}`, data);
  }

  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
