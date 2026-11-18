import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ConfigService } from '../config/config.service';
import { LoginResponse } from '../../models/auth';
import { AuthService } from './auth.service';

const RESPUESTA: LoginResponse = {
  accessToken: 'tok',
  tokenType: 'Bearer',
  expiresIn: 1800,
  usuario: {
    id: 1,
    nombre: 'Administrador Demo',
    email: 'admin@demo.com',
    rolAcceso: 'ADMINISTRADOR',
    activo: true,
  },
};

interface RouterFalso {
  url: string;
  navigate: ReturnType<typeof vi.fn>;
  navigateByUrl: ReturnType<typeof vi.fn>;
}

function crearServicio(): { auth: AuthService; http: HttpTestingController; router: RouterFalso } {
  const router: RouterFalso = { url: '/procesos/3', navigate: vi.fn(), navigateByUrl: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
      { provide: Router, useValue: router },
    ],
  });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController), router };
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('login guarda token, usuario y vencimiento', () => {
    const { auth, http } = crearServicio();
    expect(auth.haySesion()).toBe(false);

    auth.login({ email: 'admin@demo.com', password: 'admin123' }).subscribe();
    const req = http.expectOne('http://api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(RESPUESTA);

    expect(auth.token()).toBe('tok');
    expect(auth.haySesion()).toBe(true);
    expect(auth.usuario()?.email).toBe('admin@demo.com');
    expect(auth.rol()).toBe('ADMINISTRADOR');
    expect(auth.esAdmin()).toBe(true);
    expect(auth.puedeEditar()).toBe(true);
    const guardada = JSON.parse(localStorage.getItem('sesion') ?? '{}');
    expect(guardada.expiraEn).toBe(Date.now() + 1800 * 1000);
    http.verify();
  });

  it('un rol SOLO_LECTURA no es admin ni puede editar', () => {
    const { auth, http } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http
      .expectOne('http://api/auth/login')
      .flush({ ...RESPUESTA, usuario: { ...RESPUESTA.usuario, rolAcceso: 'SOLO_LECTURA' } });
    expect(auth.esAdmin()).toBe(false);
    expect(auth.puedeEditar()).toBe(false);
  });

  it('esUsuarioActual compara por id y es falso sin sesión', () => {
    const { auth, http } = crearServicio();
    expect(auth.esUsuarioActual(1)).toBe(false);
    auth.login({ email: 'admin@demo.com', password: 'admin123' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);
    expect(auth.esUsuarioActual(1)).toBe(true);
    expect(auth.esUsuarioActual(2)).toBe(false);
  });

  it('restaura la sesión guardada al crear el servicio', () => {
    localStorage.setItem(
      'sesion',
      JSON.stringify({
        token: 'guardado',
        usuario: RESPUESTA.usuario,
        expiraEn: Date.now() + 60_000,
      }),
    );
    const { auth } = crearServicio();
    expect(auth.token()).toBe('guardado');
    expect(auth.rol()).toBe('ADMINISTRADOR');
  });

  it('descarta una sesión guardada ya vencida', () => {
    localStorage.setItem(
      'sesion',
      JSON.stringify({ token: 'viejo', usuario: RESPUESTA.usuario, expiraEn: Date.now() - 1 }),
    );
    const { auth } = crearServicio();
    expect(auth.haySesion()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();
  });

  it('descarta una sesión guardada con JSON roto o incompleto', () => {
    localStorage.setItem('sesion', '{no es json');
    expect(crearServicio().auth.haySesion()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();

    localStorage.setItem('sesion', JSON.stringify({ token: 'x' }));
    expect(crearServicio().auth.haySesion()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();

    localStorage.setItem(
      'sesion',
      JSON.stringify({ token: 'x', usuario: {}, expiraEn: Date.now() + 60_000 }),
    );
    expect(crearServicio().auth.haySesion()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();
  });

  it('sigue funcionando si localStorage lanza errores', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const { auth, http } = crearServicio();
    expect(auth.haySesion()).toBe(false);
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);
    expect(auth.token()).toBe('tok');
    auth.limpiar();
    expect(auth.haySesion()).toBe(false);
    vi.restoreAllMocks();
  });

  it('token() devuelve null y limpia cuando la sesión vence', () => {
    const { auth, http } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);
    expect(auth.token()).toBe('tok');

    vi.setSystemTime(Date.now() + 1800 * 1000);
    expect(auth.token()).toBeNull();
    expect(auth.usuario()).toBeNull();
    expect(localStorage.getItem('sesion')).toBeNull();
  });

  it('logout limpia la sesión', () => {
    const { auth, http } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    auth.logout().subscribe();
    http.expectOne('http://api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    expect(auth.haySesion()).toBe(false);
    expect(localStorage.getItem('sesion')).toBeNull();
  });

  it('logout limpia la sesión aunque el back responda error', () => {
    const { auth, http } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    let terminado = false;
    auth.logout().subscribe({ complete: () => (terminado = true) });
    http.expectOne('http://api/auth/logout').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(terminado).toBe(true);
    expect(auth.haySesion()).toBe(false);
  });

  it('refrescar pide un token nuevo y reemplaza la sesión', () => {
    const { auth, http } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    vi.setSystemTime(Date.now() + 1700 * 1000);
    auth.refrescar().subscribe();
    const req = http.expectOne('http://api/auth/refresh');
    expect(req.request.method).toBe('POST');
    req.flush({ ...RESPUESTA, accessToken: 'nuevo', usuario: { ...RESPUESTA.usuario, rolAcceso: 'EDITOR' } });

    expect(auth.token()).toBe('nuevo');
    expect(auth.rol()).toBe('EDITOR');
    expect(auth.expiraEn()).toBe(Date.now() + 1800 * 1000);
    const guardada = JSON.parse(localStorage.getItem('sesion') ?? '{}');
    expect(guardada.token).toBe('nuevo');
    expect(guardada.expiraEn).toBe(Date.now() + 1800 * 1000);
    http.verify();
  });

  it('expiraEn es null sin sesión', () => {
    expect(crearServicio().auth.expiraEn()).toBeNull();
  });

  it('el vencimiento se cuenta desde que se envió la petición', () => {
    const { auth, http } = crearServicio();
    const enviadaEn = Date.now();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    const req = http.expectOne('http://api/auth/login');
    vi.setSystemTime(enviadaEn + 3000);
    req.flush(RESPUESTA);
    expect(auth.expiraEn()).toBe(enviadaEn + 1800 * 1000);
  });

  it('cerrarPorVencimiento limpia y va al login con returnUrl', () => {
    const { auth, http, router } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    auth.cerrarPorVencimiento();
    expect(auth.haySesion()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/procesos/3' } });
  });

  it('si otra pestaña entra con otro usuario, vuelve al inicio', () => {
    const { auth, http, router } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    const otro = { token: 'beta', usuario: { ...RESPUESTA.usuario, id: 7 }, expiraEn: Date.now() + 60_000 };
    localStorage.setItem('sesion', JSON.stringify(otro));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sesion' }));
    expect(auth.usuario()?.id).toBe(7);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('recarga la sesión cuando otra pestaña la cambia o la borra', () => {
    const { auth, http, router } = crearServicio();
    auth.login({ email: 'a@b.c', password: '12345678' }).subscribe();
    http.expectOne('http://api/auth/login').flush(RESPUESTA);

    const renovada = { token: 'otra-pestana', usuario: RESPUESTA.usuario, expiraEn: Date.now() + 3600_000 };
    localStorage.setItem('sesion', JSON.stringify(renovada));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sesion' }));
    expect(auth.token()).toBe('otra-pestana');
    expect(auth.expiraEn()).toBe(renovada.expiraEn);
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    window.dispatchEvent(new StorageEvent('storage', { key: 'otra-clave' }));
    expect(auth.token()).toBe('otra-pestana');

    localStorage.removeItem('sesion');
    window.dispatchEvent(new StorageEvent('storage', { key: 'sesion' }));
    expect(auth.haySesion()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/procesos/3' } });
  });
});
