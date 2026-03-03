import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  IChangePassword,
  ICreateUser,
  IUpdateUser,
  IUser,
  IUserSummary,
  PaginatedApiResponse,
} from '@cadena24-wms/shared';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  role?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getAll(query?: UserQueryParams): Observable<PaginatedApiResponse<IUserSummary>> {
    let params = new HttpParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedApiResponse<IUserSummary>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<IUser>> {
    return this.http.get<ApiResponse<IUser>>(`${this.apiUrl}/${id}`);
  }

  create(dto: ICreateUser): Observable<ApiResponse<IUser>> {
    return this.http.post<ApiResponse<IUser>>(this.apiUrl, dto);
  }

  update(id: number, dto: IUpdateUser): Observable<ApiResponse<IUser>> {
    return this.http.patch<ApiResponse<IUser>>(`${this.apiUrl}/${id}`, dto);
  }

  toggleStatus(id: number): Observable<ApiResponse<IUser>> {
    return this.http.patch<ApiResponse<IUser>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  changePassword(id: number, dto: IChangePassword): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/${id}/password`, dto);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
