import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfigService } from '../config/config.service';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: { token: ReturnType<typeof vi.fn>; limpiar: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { token: vi.fn().mockReturnValue('tok'), limpiar: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('agrega el Bearer a las peticiones al API', () => {
    http.get('http://api/procesos').subscribe();
    const req = ctrl.expectOne('http://api/procesos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush([]);
  });

  it('no agrega el header sin sesión', () => {
    auth.token.mockReturnValue(null);
    http.get('http://api/procesos').subscribe();
    const req = ctrl.expectOne('http://api/procesos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('no agrega el header a otro host', () => {
    http.get('http://otro.com/datos').subscribe();
    const req = ctrl.expectOne('http://otro.com/datos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('no agrega el header a una URL que solo comparte el prefijo del API', () => {
    http.get('http://api-falsa.com/datos').subscribe();
    const req = ctrl.expectOne('http://api-falsa.com/datos');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('un 401 limpia la sesión, va al login y relanza el error', () => {
    let status = 0;
    http.get('http://api/procesos').subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('http://api/procesos').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.limpiar).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(status).toBe(401);
  });

  it('un 401 del login no limpia ni navega, pero relanza el error', () => {
    let status = 0;
    http.post('http://api/auth/login', {}).subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne('http://api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.limpiar).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(status).toBe(401);
  });

  it('un 401 del logout no navega (lo hace quien cierra la sesión)', () => {
    http.post('http://api/auth/logout', null).subscribe({ error: () => undefined });
    ctrl.expectOne('http://api/auth/logout').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('otros errores no tocan la sesión', () => {
    http.get('http://api/procesos').subscribe({ error: () => undefined });
    ctrl.expectOne('http://api/procesos').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(auth.limpiar).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
