import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthStateService } from '../../pages/login/services/auth-state.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authState: jest.Mocked<AuthStateService>;
  let router: jest.Mocked<Router>;

  const mockAuthState = {
    refreshSession: jest.fn(),
    currentUser: { set: jest.fn() },
    isAuthenticated: jest.fn(),
  };

  const mockRouter = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStateService, useValue: mockAuthState },
        { provide: Router, useValue: mockRouter },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authState = TestBed.inject(AuthStateService) as jest.Mocked<AuthStateService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('1 — clones every request with withCredentials: true', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('2 — passes through 200 responses without modification', (done) => {
    http.get('/api/test').subscribe((res) => {
      expect(res).toBeTruthy();
      done();
    });
    const req = httpMock.expectOne('/api/test');
    req.flush({ data: 'ok' });
  });

  it('3 — does NOT call refreshSession() on 404 error', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/test');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
    expect(authState.refreshSession).not.toHaveBeenCalled();
  });

  it('4 — calls authState.refreshSession() on 401 from non-auth endpoint', () => {
    authState.refreshSession.mockReturnValue(of(false));
    router.navigate.mockReturnValue(Promise.resolve(true));

    http.get('/api/users').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/users');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authState.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('5 — retries original request after successful refresh', (done) => {
    authState.refreshSession.mockReturnValue(of(true));

    http.get('/api/users').subscribe({
      next: (res) => {
        expect(res).toBeTruthy();
        done();
      },
      error: done,
    });

    // First request fails with 401
    const req1 = httpMock.expectOne('/api/users');
    req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Retry after refresh
    const req2 = httpMock.expectOne('/api/users');
    req2.flush({ data: 'users' });
  });

  it('6 — navigates to /login when refresh fails after 401', (done) => {
    authState.refreshSession.mockReturnValue(of(false));
    router.navigate.mockReturnValue(Promise.resolve(true));

    http.get('/api/users').subscribe({
      error: () => {
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      },
    });

    const req = httpMock.expectOne('/api/users');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('7 — does NOT attempt refresh on 401 from /auth/refresh endpoint', () => {
    http.post('/api/auth/refresh', {}).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/auth/refresh');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authState.refreshSession).not.toHaveBeenCalled();
  });

  it('8 — does NOT attempt refresh on 401 from /auth/login endpoint', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => {} });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authState.refreshSession).not.toHaveBeenCalled();
  });

  it('9 — passes through the error after redirect on failed refresh', (done) => {
    authState.refreshSession.mockReturnValue(of(false));
    router.navigate.mockReturnValue(Promise.resolve(true));

    http.get('/api/test').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
        done();
      },
    });

    const req = httpMock.expectOne('/api/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
  });

  it('10 — interceptor is defined and functional', () => {
    expect(authInterceptor).toBeDefined();
  });
});
