import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStateService } from '../../pages/login/services/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // If state already hydrated (e.g. navigating between routes), use cached value
  if (authState.isAuthenticated()) {
    return true;
  }

  // On page reload: state is empty — try to hydrate from cookie via /auth/me
  return authState.hydrateFromSession().pipe(
    map((authenticated) => {
      if (authenticated) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
