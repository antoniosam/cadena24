import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ApiResponse, ITokenUser, RoleCode } from '@cadena24-wms/shared';
import { environment } from '../../../../environments/environment';

const mockTokenUser: ITokenUser = {
  id: 1,
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: RoleCode.USER,
  active: true,
};

const mockResponse: ApiResponse<ITokenUser> = {
  success: true,
  message: 'OK',
  data: mockTokenUser,
  timestamp: new Date().toISOString(),
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── login() ─────────────────────────────────────────────────────────────────

  it('1 — login() makes POST to /api/auth/login', () => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('2 — login() sends { email, password } in body', () => {
    const dto = { email: 'a@b.com', password: 'pass' };
    service.login(dto).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.body).toEqual(dto);
    req.flush(mockResponse);
  });

  it('3 — login() request has withCredentials: true', () => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockResponse);
  });

  // ── refresh() ───────────────────────────────────────────────────────────────

  it('4 — refresh() makes POST to /api/auth/refresh', () => {
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('5 — refresh() request has withCredentials: true', () => {
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockResponse);
  });

  it('6 — refresh() sends empty body {}', () => {
    service.refresh().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.body).toEqual({});
    req.flush(mockResponse);
  });

  // ── logout() ────────────────────────────────────────────────────────────────

  it('7 — logout() makes POST to /api/auth/logout', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, message: 'OK', data: null, timestamp: '' });
  });

  it('8 — logout() request has withCredentials: true', () => {
    service.logout().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true, message: 'OK', data: null, timestamp: '' });
  });

  // ── me() ────────────────────────────────────────────────────────────────────

  it('9 — me() makes GET to /api/auth/me', () => {
    service.me().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('10 — me() request has withCredentials: true', () => {
    service.me().subscribe();

    const req = httpMock.expectOne(`${baseUrl}/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(mockResponse);
  });

  it('11 — login() returns observable with ApiResponse<ITokenUser>', (done) => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe((res) => {
      expect(res.data).toEqual(mockTokenUser);
      done();
    });

    const req = httpMock.expectOne(`${baseUrl}/login`);
    req.flush(mockResponse);
  });

  it('12 — me() returns observable with ApiResponse<ITokenUser>', (done) => {
    service.me().subscribe((res) => {
      expect(res.data).toEqual(mockTokenUser);
      done();
    });

    const req = httpMock.expectOne(`${baseUrl}/me`);
    req.flush(mockResponse);
  });
});
