import { inject } from '@angular/core';
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStateService } from '../../pages/login/services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // Always send cookies with requests
  const reqWithCredentials = req.clone({ withCredentials: true });

  return next(reqWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 and avoid infinite loops on refresh/login endpoints
      const isAuthEndpoint = req.url.includes('/auth/refresh') || req.url.includes('/auth/login');

      if (error.status === 401 && !isAuthEndpoint) {
        // Attempt silent refresh
        return authState.refreshSession().pipe(
          switchMap((refreshed) => {
            if (refreshed) {
              // Retry original request — cookies are now updated
              return next(req.clone({ withCredentials: true }));
            }
            // Refresh failed — session is invalid
            router.navigate(['/login']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
