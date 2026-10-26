// Agrega el token Bearer a las peticiones al API y cierra la sesión ante un 401.
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiUrl = inject(ConfigService).apiUrl;

  if (req.url !== apiUrl && !req.url.startsWith(`${apiUrl}/`)) {
    return next(req);
  }

  const token = auth.token();
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !/\/auth\/(login|logout)$/.test(req.url)) {
        auth.limpiar();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
