import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { RolAcceso } from '../../models/enums';
import { AuthService } from '../services/auth.service';
import { authGuard, rolGuard } from './auth.guard';

function configurar(sesion: { hay: boolean; rol: RolAcceso | null }): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { haySesion: () => sesion.hay, rol: () => sesion.rol } },
    ],
  });
}

function ejecutar(guard: typeof authGuard, data: Record<string, unknown>, url: string) {
  const route = { data } as unknown as ActivatedRouteSnapshot;
  const state = { url } as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state));
}

describe('authGuard', () => {
  it('deja pasar con sesión', () => {
    configurar({ hay: true, rol: 'EDITOR' });
    expect(ejecutar(authGuard, {}, '/procesos')).toBe(true);
  });

  it('sin sesión redirige al login con returnUrl', () => {
    configurar({ hay: false, rol: null });
    const resultado = ejecutar(authGuard, {}, '/procesos?pagina=2');
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe(
      '/login?returnUrl=%2Fprocesos%3Fpagina%3D2',
    );
  });
});

describe('rolGuard', () => {
  const data = { roles: ['ADMINISTRADOR'] };

  it('deja pasar si el rol está permitido', () => {
    configurar({ hay: true, rol: 'ADMINISTRADOR' });
    expect(ejecutar(rolGuard, data, '/usuarios')).toBe(true);
  });

  it('redirige al inicio si el rol no está permitido', () => {
    configurar({ hay: true, rol: 'EDITOR' });
    const resultado = ejecutar(rolGuard, data, '/usuarios');
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/');
  });

  it('redirige al inicio sin rol ni roles configurados', () => {
    configurar({ hay: false, rol: null });
    const resultado = ejecutar(rolGuard, {}, '/usuarios');
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/');
  });
});
