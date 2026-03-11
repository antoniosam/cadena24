import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PickList,
  PickListsResponse,
  GeneratePickListDto,
  AssignPickerDto,
  PickLineDto,
  QueryPickListsDto,
  OptimizedRouteResponse,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PickingApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/pick-lists`;

  getPickLists(filters?: QueryPickListsDto): Observable<PickListsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<PickListsResponse>(this.apiUrl, { params });
  }

  getPickList(id: number): Observable<PickList> {
    return this.http.get<PickList>(`${this.apiUrl}/${id}`);
  }

  getOptimizedRoute(id: number): Observable<OptimizedRouteResponse> {
    return this.http.get<OptimizedRouteResponse>(`${this.apiUrl}/${id}/optimized-route`);
  }

  generatePickList(data: GeneratePickListDto): Observable<PickList> {
    return this.http.post<PickList>(`${this.apiUrl}/generate`, data);
  }

  assignPicker(id: number, data: AssignPickerDto): Observable<PickList> {
    return this.http.patch<PickList>(`${this.apiUrl}/${id}/assign-picker`, data);
  }

  start(id: number): Observable<PickList> {
    return this.http.patch<PickList>(`${this.apiUrl}/${id}/start`, {});
  }

  pickLine(
    id: number,
    data: PickLineDto
  ): Observable<{
    lineId: number;
    quantityPicked: number;
    status: string;
    isShort: boolean;
    missing: number;
  }> {
    return this.http.post<{
      lineId: number;
      quantityPicked: number;
      status: string;
      isShort: boolean;
      missing: number;
    }>(`${this.apiUrl}/${id}/pick-line`, data);
  }

  complete(id: number): Observable<PickList> {
    return this.http.post<PickList>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancel(id: number): Observable<PickList> {
    return this.http.delete<PickList>(`${this.apiUrl}/${id}`);
  }
}
