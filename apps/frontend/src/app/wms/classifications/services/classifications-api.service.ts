import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Classification,
  ClassificationsResponse,
  CreateClassificationDto,
  UpdateClassificationDto,
  ClassificationQueryDto,
} from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClassificationsApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wms/classifications`;

  getClassifications(filters?: ClassificationQueryDto): Observable<ClassificationsResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ClassificationsResponse>(this.apiUrl, { params });
  }

  getClassification(id: number): Observable<Classification> {
    return this.http.get<Classification>(`${this.apiUrl}/${id}`);
  }

  createClassification(data: CreateClassificationDto): Observable<Classification> {
    return this.http.post<Classification>(this.apiUrl, data);
  }

  updateClassification(id: number, data: UpdateClassificationDto): Observable<Classification> {
    return this.http.patch<Classification>(`${this.apiUrl}/${id}`, data);
  }

  deleteClassification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
