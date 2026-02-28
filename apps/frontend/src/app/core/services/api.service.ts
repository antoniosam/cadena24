import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '@cadena24-wms/shared';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getHealth(): Observable<ApiResponse<{ status: string; version: string }>> {
    return this.http.get<ApiResponse<{ status: string; version: string }>>(this.apiUrl);
  }
}
