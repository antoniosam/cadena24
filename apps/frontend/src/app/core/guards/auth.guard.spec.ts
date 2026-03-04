import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthStateService } from '../../pages/login/services/auth-state.service';

describe('authGuard', () => {
  let isAuthenticatedValue: boolean;
  let hydrateResult: boolean;

  const mockAuthState = {
    get isAuthenticated() {
      return () => isAuthenticatedValue;
    },
    hydrateFromSession: jest.fn(),
  };

  const mockRouter = {
    navigate: jest.fn(),
    createUrlTree: jest.fn(),
  };

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  const runGuard = () => TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

  beforeEach(() => {
    isAuthenticatedValue = false;
    hydrateResult = false;
    mockAuthState.hydrateFromSession = jest.fn().mockReturnValue(of(false));
    mockRouter.navigate.mockClear();
    mockRouter.createUrlTree.mockClear();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStateService, useValue: mockAuthState },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('1 — returns true immediately when isAuthenticated() is true', () => {
    isAuthenticatedValue = true;

    const result = runGuard();

    expect(result).toBe(true);
    expect(mockAuthState.hydrateFromSession).not.toHaveBeenCalled();
  });

  it('2 — calls hydrateFromSession() when isAuthenticated() is false', (done) => {
    isAuthenticatedValue = false;
    mockAuthState.hydrateFromSession.mockReturnValue(of(true));

    (runGuard() as ReturnType<typeof of>).subscribe(() => {
      expect(mockAuthState.hydrateFromSession).toHaveBeenCalledTimes(1);
      done();
    });
  });

  it('3 — returns true after successful hydration', (done) => {
    isAuthenticatedValue = false;
    mockAuthState.hydrateFromSession.mockReturnValue(of(true));

    (runGuard() as ReturnType<typeof of>).subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('4 — returns UrlTree(/login) when hydration fails', (done) => {
    isAuthenticatedValue = false;
    mockAuthState.hydrateFromSession.mockReturnValue(of(false));
    const mockUrlTree = { queryParams: {} };
    mockRouter.createUrlTree.mockReturnValue(mockUrlTree);

    (runGuard() as ReturnType<typeof of>).subscribe((result) => {
      expect(result).toBe(mockUrlTree);
      done();
    });
  });

  it('5 — does NOT call hydrateFromSession() if already authenticated', () => {
    isAuthenticatedValue = true;

    runGuard();

    expect(mockAuthState.hydrateFromSession).not.toHaveBeenCalled();
  });

  it('6 — redirect UrlTree uses path /login', (done) => {
    isAuthenticatedValue = false;
    mockAuthState.hydrateFromSession.mockReturnValue(of(false));
    mockRouter.createUrlTree.mockReturnValue({ queryParams: {} });

    (runGuard() as ReturnType<typeof of>).subscribe(() => {
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
      done();
    });
  });
});
