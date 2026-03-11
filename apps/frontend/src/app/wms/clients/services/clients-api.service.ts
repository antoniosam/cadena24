import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Client,
  ClientsResponse,
  CreateClientDto,
  UpdateClientDto,
  QueryClientsDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClientsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/clients`;

  getClients(filters?: QueryClientsDto): Observable<ClientsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<ClientsResponse>(this.apiUrl, { params });
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  createClient(data: CreateClientDto): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, data);
  }

  updateClient(id: number, data: UpdateClientDto): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}`, data);
  }

  setStatus(id: number, isActive: boolean): Observable<Client> {
    return this.http.patch<Client>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}
