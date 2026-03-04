import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { ITokenUser } from '@cadena24-wms/shared';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ── State signals ──────────────────────────────────────────────────────────
  readonly currentUser = signal<ITokenUser | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly refreshing = signal<boolean>(false);

  // ── Computed ───────────────────────────────────────────────────────────────
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly userName = computed(() => {
    const u = this.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : null;
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Called from LoginPageComponent on form submit.
   * On success: sets currentUser + navigates to /dashboard
   */
  login(email: string, password: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.currentUser.set(res.data ?? null);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message ?? 'Error al iniciar sesión');
        this.loading.set(false);
      },
    });
  }

  /**
   * Called by AuthInterceptor when it catches a 401.
   * Returns Observable<boolean> — true if refresh succeeded, false if failed.
   */
  refreshSession(): Observable<boolean> {
    this.refreshing.set(true);
    return this.authService.refresh().pipe(
      map((res) => {
        this.currentUser.set(res.data ?? null);
        this.refreshing.set(false);
        return true;
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.refreshing.set(false);
        return of(false);
      })
    );
  }

  /**
   * Called from navbar or profile menu.
   * Clears state + navigates to /login.
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.currentUser.set(null);
        this.error.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if server call fails, clear local state
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
    });
  }

  /**
   * Called by authGuard on page reload to hydrate state.
   * Hits GET /auth/me — if valid cookie exists → sets user.
   */
  hydrateFromSession(): Observable<boolean> {
    return this.authService.me().pipe(
      map((res) => {
        this.currentUser.set(res.data ?? null);
        return true;
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(false);
      })
    );
  }

  clearError(): void {
    this.error.set(null);
  }
}
