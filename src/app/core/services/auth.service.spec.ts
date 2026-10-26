import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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

function crearServicio(): { auth: AuthService; http: HttpTestingController } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: ConfigService, useValue: { apiUrl: 'http://api' } },
    ],
  });
  return { auth: TestBed.inject(AuthService), http: TestBed.inject(HttpTestingController) };
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
});
