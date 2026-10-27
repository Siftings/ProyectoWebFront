import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProcesosService } from '../../../core/services/procesos.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { RolAcceso } from '../../../models/enums';
import { ProcesoDetalleResponse } from '../../../models/proceso';
import { ProcesoDetalle } from './proceso-detalle';

const DETALLE: ProcesoDetalleResponse = {
  proceso: {
    id: 7,
    nombre: 'Compras',
    descripcion: 'Flujo de compras',
    categoria: 'Finanzas',
    estado: 'BORRADOR',
    activo: true,
    fechaCreacion: '2026-10-26T10:00:00',
    fechaModificacion: '2026-10-27T09:30:00',
  },
  historial: [
    { id: 2, fechaCambio: '2026-10-27T09:30:00', descripcionCambio: 'Proceso editado.', autorNombre: 'Ana' },
    { id: 1, fechaCambio: '2026-10-26T10:00:00', descripcionCambio: 'Proceso creado.', autorNombre: 'Luis' },
  ],
};

function problema(status: number, title: string, detail: string): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { type: 'x', title, status, detail, instance: '/' } });
}

function crear(servicio: Partial<Record<keyof ProcesosService, unknown>>, id = '7', rol: RolAcceso = 'ADMINISTRADOR') {
  TestBed.configureTestingModule({
    imports: [ProcesoDetalle],
    providers: [
      provideRouter([]),
      { provide: ProcesosService, useValue: servicio },
      { provide: UsuarioActualService, useValue: { puedeEditar: signal(rol !== 'SOLO_LECTURA') } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
    ],
  });
  const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ProcesoDetalle);
  fixture.detectChanges();
  return { fixture, navegar, el: fixture.nativeElement as HTMLElement };
}

function textos(el: HTMLElement, selector: string): string[] {
  return Array.from(el.querySelectorAll(selector)).map((n) => n.textContent?.trim() ?? '');
}

describe('ProcesoDetalle', () => {
  it('pide el proceso de la ruta y muestra datos e historial en el orden recibido', () => {
    const obtener = vi.fn(() => of(DETALLE));
    const { el } = crear({ obtener });

    expect(obtener).toHaveBeenCalledWith(7);
    expect(el.querySelector('h1')?.textContent).toContain('Compras');
    expect(textos(el, 'dd')).toEqual(['Flujo de compras', 'Finanzas', '26/10/2026 10:00', '27/10/2026 09:30']);
    expect(textos(el, 'tbody td')).toEqual([
      '27/10/2026 09:30',
      'Proceso editado.',
      'Ana',
      '26/10/2026 10:00',
      'Proceso creado.',
      'Luis',
    ]);
  });

  it('sin historial muestra el aviso', () => {
    const { el } = crear({ obtener: () => of({ ...DETALLE, historial: [] }) });
    expect(el.textContent).toContain('Sin cambios registrados.');
    expect(el.querySelector('table')).toBeNull();
  });

  it('muestra el detail del 404 y no pinta datos', () => {
    const { el } = crear({ obtener: () => throwError(() => problema(404, 'No encontrado', 'Proceso no encontrado.')) }, '99');
    expect(textos(el, '.alerta-error')).toEqual(['Proceso no encontrado.']);
    expect(el.querySelector('h1')).toBeNull();
  });

  it('un id no numérico lleva al listado sin pedir nada', () => {
    const obtener = vi.fn();
    const { navegar } = crear({ obtener }, 'abc');
    expect(obtener).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/procesos']);
  });

  it('SOLO_LECTURA no ve editar pero sí diagrama y compartir', () => {
    const { el } = crear({ obtener: () => of(DETALLE) }, '7', 'SOLO_LECTURA');
    expect(textos(el, '.acciones > a')).toEqual(['Diagrama', 'Compartir']);
  });

  it('EDITOR ve editar, diagrama y compartir con sus rutas', () => {
    const { el } = crear({ obtener: () => of(DETALLE) }, '7', 'EDITOR');
    expect(textos(el, '.acciones > a')).toEqual(['Editar datos', 'Diagrama', 'Compartir']);
    expect(Array.from(el.querySelectorAll('.acciones > a')).map((a) => a.getAttribute('href'))).toEqual([
      '/procesos/7/editar',
      '/procesos/7/diagrama',
      '/procesos/7/compartir',
    ]);
  });

  it('avisa que el diagrama de un proceso publicado no se modifica', () => {
    const publicado = { ...DETALLE, proceso: { ...DETALLE.proceso, estado: 'PUBLICADO' as const } };
    const { el } = crear({ obtener: () => of(publicado) });
    expect(el.querySelector('.alerta-aviso')?.textContent).toContain('no se puede modificar');
  });
});
