import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { UsuarioResponse } from '../../models/auth';
import { AuthService } from './auth.service';
import { AVISO_SEGUNDOS, SesionExpiracionService } from './sesion-expiracion.service';

function crear(segundosParaVencer: number | null) {
  const expiraEn = signal<number | null>(
    segundosParaVencer === null ? null : Date.now() + segundosParaVencer * 1000,
  );
  let refresco = new Subject<UsuarioResponse>();
  const auth = {
    expiraEn,
    cerrarPorVencimiento: vi.fn(() => expiraEn.set(null)),
    refrescar: vi.fn(() => {
      refresco = new Subject<UsuarioResponse>();
      return refresco;
    }),
  };
  TestBed.configureTestingModule({
    providers: [
      SesionExpiracionService,
      { provide: AuthService, useValue: auth },
    ],
  });
  const servicio = TestBed.inject(SesionExpiracionService);
  TestBed.tick();
  return { servicio, auth, expiraEn, refresco: () => refresco };
}

function avanzar(segundos: number): void {
  vi.advanceTimersByTime(segundos * 1000);
  TestBed.tick();
}

describe('SesionExpiracionService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin sesión no cuenta ni avisa', () => {
    const { servicio } = crear(null);
    expect(servicio.segundosRestantes()).toBeNull();
    expect(servicio.mostrarAviso()).toBe(false);
  });

  it('no avisa con más de dos minutos y avisa al llegar a dos', () => {
    const { servicio } = crear(AVISO_SEGUNDOS + 5);
    expect(servicio.mostrarAviso()).toBe(false);
    expect(servicio.segundosRestantes()).toBe(AVISO_SEGUNDOS + 5);

    avanzar(4);
    expect(servicio.mostrarAviso()).toBe(false);
    avanzar(1);
    expect(servicio.segundosRestantes()).toBe(AVISO_SEGUNDOS);
    expect(servicio.mostrarAviso()).toBe(true);

    avanzar(30);
    expect(servicio.segundosRestantes()).toBe(AVISO_SEGUNDOS - 30);
  });

  it('al llegar a cero cierra la sesión por vencimiento una sola vez', () => {
    const { servicio, auth } = crear(3);
    avanzar(2);
    expect(auth.cerrarPorVencimiento).not.toHaveBeenCalled();

    avanzar(1);
    expect(auth.cerrarPorVencimiento).toHaveBeenCalledTimes(1);
    expect(servicio.mostrarAviso()).toBe(false);

    avanzar(5);
    expect(auth.cerrarPorVencimiento).toHaveBeenCalledTimes(1);
  });

  it('si la sesión termina con una renovación en curso, la cancela', () => {
    const { servicio, refresco } = crear(2);
    servicio.continuar();
    expect(refresco().observed).toBe(true);

    avanzar(2);
    expect(refresco().observed).toBe(false);
    expect(servicio.renovando()).toBe(false);
  });

  it('recalcula con el reloj aunque el intervalo se haya retrasado', () => {
    const { servicio } = crear(600);
    vi.setSystemTime(Date.now() + 590 * 1000);
    document.dispatchEvent(new Event('visibilitychange'));
    TestBed.tick();
    expect(servicio.segundosRestantes()).toBe(10);
    expect(servicio.mostrarAviso()).toBe(true);
  });

  it('continuar renueva y oculta el aviso', () => {
    const { servicio, auth, expiraEn, refresco } = crear(60);
    expect(servicio.mostrarAviso()).toBe(true);

    servicio.continuar();
    servicio.continuar();
    expect(auth.refrescar).toHaveBeenCalledTimes(1);
    expect(servicio.renovando()).toBe(true);

    expiraEn.set(Date.now() + 1800 * 1000);
    refresco().next({} as UsuarioResponse);
    refresco().complete();
    TestBed.tick();
    expect(servicio.renovando()).toBe(false);
    expect(servicio.mostrarAviso()).toBe(false);
    expect(servicio.segundosRestantes()).toBe(1800);
  });

  it('si la renovación falla muestra el detail y permite reintentar', () => {
    const { servicio, auth, refresco } = crear(60);
    servicio.continuar();
    refresco().error(
      new HttpErrorResponse({ status: 503, error: { title: 'Error', status: 503, detail: 'Servicio caído' } }),
    );
    expect(servicio.error()).toBe('Servicio caído');
    expect(servicio.renovando()).toBe(false);
    expect(servicio.mostrarAviso()).toBe(true);

    servicio.continuar();
    expect(auth.refrescar).toHaveBeenCalledTimes(2);
    expect(servicio.error()).toBeNull();
  });
});
