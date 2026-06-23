import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * JWT Interceptor
 * OWASP A07 – Identification and Authentication Failures
 * Adjunta el Bearer token a todas las peticiones autenticadas.
 * En 401 (token expirado/inválido) hace logout automático.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Logout automático si el token expiró o es inválido
      if (err.status === 401 && auth.isLoggedIn()) {
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
