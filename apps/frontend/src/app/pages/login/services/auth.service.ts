import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ILoginRequest, ITokenUser } from '@cadena24-wms/shared';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // All requests use withCredentials: true so cookies are sent/received automatically

  login(dto: ILoginRequest): Observable<ApiResponse<ITokenUser>> {
    return this.http.post<ApiResponse<ITokenUser>>(`${this.apiUrl}/login`, dto, {
      withCredentials: true,
    });
  }

  refresh(): Observable<ApiResponse<ITokenUser>> {
    return this.http.post<ApiResponse<ITokenUser>>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    );
  }

  me(): Observable<ApiResponse<ITokenUser>> {
    return this.http.get<ApiResponse<ITokenUser>>(`${this.apiUrl}/me`, {
      withCredentials: true,
    });
  }
}
