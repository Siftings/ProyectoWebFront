// Guards de rutas: exigir sesión y exigir uno de los roles de route.data['roles'].
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from '../../models/enums';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).haySesion()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const rolGuard: CanActivateFn = (route) => {
  const roles = (route.data['roles'] ?? []) as RolAcceso[];
  const rol = inject(AuthService).rol();
  if (rol !== null && roles.includes(rol)) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
