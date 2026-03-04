import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStateService } from './auth-state.service';
import { AuthService } from './auth.service';
import { ITokenUser, RoleCode } from '@cadena24-wms/shared';

const mockTokenUser: ITokenUser = {
  id: 1,
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: RoleCode.USER,
  active: true,
};

describe('AuthStateService', () => {
  let service: AuthStateService;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const mockAuthService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    };

    const mockRouter = {
      navigate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthStateService);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('1 — currentUser() is null initially', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('2 — loading() is false initially', () => {
    expect(service.loading()).toBe(false);
  });

  it('3 — error() is null initially', () => {
    expect(service.error()).toBeNull();
  });

  it('4 — refreshing() is false initially', () => {
    expect(service.refreshing()).toBe(false);
  });

  it('5 — isAuthenticated() is false when currentUser is null', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('6 — isAuthenticated() is true when currentUser is set', () => {
    service.currentUser.set(mockTokenUser);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('7 — userName() returns null when not authenticated', () => {
    expect(service.userName()).toBeNull();
  });

  it('8 — userName() returns "firstName lastName" when authenticated', () => {
    service.currentUser.set(mockTokenUser);
    expect(service.userName()).toBe('Test User');
  });

  // ── login() action ─────────────────────────────────────────────────────────

  it('9 — login() sets loading=true synchronously before subscribe', () => {
    // Use a subject that never emits to keep it pending
    const { Subject } = require('rxjs');
    const subject = new Subject();
    authService.login.mockReturnValue(subject.asObservable());

    service.login('a@b.com', 'pass');

    expect(service.loading()).toBe(true);
    // complete to avoid open subscriptions
    subject.complete();
  });

  it('10 — login() sets currentUser on success', (done) => {
    authService.login.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.login('user@example.com', 'password');

    setTimeout(() => {
      expect(service.currentUser()).toEqual(mockTokenUser);
      done();
    }, 0);
  });

  it('11 — login() sets loading=false on success', (done) => {
    authService.login.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.login('user@example.com', 'password');

    setTimeout(() => {
      expect(service.loading()).toBe(false);
      done();
    }, 0);
  });

  it('12 — login() calls router.navigate(["/dashboard"]) on success', (done) => {
    authService.login.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.login('user@example.com', 'password');

    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      done();
    }, 0);
  });

  it('13 — login() sets error signal on HTTP failure', (done) => {
    authService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Credenciales incorrectas' } }))
    );

    service.login('user@example.com', 'wrong');

    setTimeout(() => {
      expect(service.error()).toBe('Credenciales incorrectas');
      done();
    }, 0);
  });

  it('14 — login() sets loading=false on failure', (done) => {
    authService.login.mockReturnValue(throwError(() => ({ error: {} })));

    service.login('user@example.com', 'wrong');

    setTimeout(() => {
      expect(service.loading()).toBe(false);
      done();
    }, 0);
  });

  it('15 — login() does NOT navigate on failure', (done) => {
    authService.login.mockReturnValue(throwError(() => ({ error: {} })));

    service.login('user@example.com', 'wrong');

    setTimeout(() => {
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    }, 0);
  });

  // ── logout() action ────────────────────────────────────────────────────────

  it('16 — logout() clears currentUser to null on success', (done) => {
    service.currentUser.set(mockTokenUser);
    authService.logout.mockReturnValue(
      of({ success: true, data: null, message: '', timestamp: '' })
    );

    service.logout();

    setTimeout(() => {
      expect(service.currentUser()).toBeNull();
      done();
    }, 0);
  });

  it('17 — logout() calls router.navigate(["/login"]) on success', (done) => {
    authService.logout.mockReturnValue(
      of({ success: true, data: null, message: '', timestamp: '' })
    );

    service.logout();

    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      done();
    }, 0);
  });

  it('18 — logout() clears currentUser and navigates to login EVEN on HTTP error', (done) => {
    service.currentUser.set(mockTokenUser);
    authService.logout.mockReturnValue(throwError(() => new Error('Network error')));

    service.logout();

    setTimeout(() => {
      expect(service.currentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      done();
    }, 0);
  });

  // ── hydrateFromSession() ──────────────────────────────────────────────────

  it('19 — hydrateFromSession() sets currentUser and returns true on success', (done) => {
    authService.me.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.hydrateFromSession().subscribe((result) => {
      expect(result).toBe(true);
      expect(service.currentUser()).toEqual(mockTokenUser);
      done();
    });
  });

  it('20 — hydrateFromSession() returns false and keeps currentUser=null on failure', (done) => {
    authService.me.mockReturnValue(throwError(() => new Error('Unauthorized')));

    service.hydrateFromSession().subscribe((result) => {
      expect(result).toBe(false);
      expect(service.currentUser()).toBeNull();
      done();
    });
  });

  // ── refreshSession() ──────────────────────────────────────────────────────

  it('21 — refreshSession() sets refreshing=false after success', (done) => {
    authService.refresh.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.refreshSession().subscribe(() => {
      expect(service.refreshing()).toBe(false);
      done();
    });
  });

  it('22 — refreshSession() updates currentUser on successful refresh', (done) => {
    authService.refresh.mockReturnValue(
      of({ success: true, data: mockTokenUser, message: '', timestamp: '' })
    );

    service.refreshSession().subscribe(() => {
      expect(service.currentUser()).toEqual(mockTokenUser);
      done();
    });
  });

  it('23 — refreshSession() returns false and clears currentUser when refresh fails', (done) => {
    service.currentUser.set(mockTokenUser);
    authService.refresh.mockReturnValue(throwError(() => new Error('Expired')));

    service.refreshSession().subscribe((result) => {
      expect(result).toBe(false);
      expect(service.currentUser()).toBeNull();
      done();
    });
  });

  // ── clearError() ──────────────────────────────────────────────────────────

  it('24 — clearError() sets error to null', () => {
    service.error.set('Some error');
    service.clearError();
    expect(service.error()).toBeNull();
  });
});
