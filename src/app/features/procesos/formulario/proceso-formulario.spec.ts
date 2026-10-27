import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProcesosService } from '../../../core/services/procesos.service';
import { ProcesoResponse } from '../../../models/proceso';
import { ProcesoFormulario } from './proceso-formulario';

const PROCESO: ProcesoResponse = {
  id: 7,
  nombre: 'Compras',
  descripcion: 'Flujo de compras',
  categoria: 'Finanzas',
  estado: 'BORRADOR',
  activo: true,
  fechaCreacion: '2026-10-26T10:00:00',
  fechaModificacion: '2026-10-26T10:00:00',
};

function problema(status: number, title: string, detail: string): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: { type: 'x', title, status, detail, instance: '/' } });
}

function crear(servicio: Partial<Record<keyof ProcesosService, unknown>>, id?: string) {
  TestBed.configureTestingModule({
    imports: [ProcesoFormulario],
    providers: [
      provideRouter([]),
      { provide: ProcesosService, useValue: servicio },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => id ?? null } } },
      },
    ],
  });
  const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ProcesoFormulario);
  fixture.detectChanges();
  return { fixture, navegar };
}

function llenar(componente: ProcesoFormulario): void {
  componente.form.setValue({ nombre: ' Compras ', descripcion: ' Flujo ', categoria: ' Finanzas ' });
}

describe('ProcesoFormulario', () => {
  it('no envía si el formulario es inválido', () => {
    const crearProceso = vi.fn();
    const { fixture } = crear({ crear: crearProceso });
    fixture.componentInstance.enviar();
    expect(crearProceso).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.nombre.touched).toBe(true);
  });

  it('un id no numérico lleva al listado sin pedir nada', () => {
    const obtener = vi.fn();
    const { navegar } = crear({ obtener }, 'abc');
    expect(obtener).not.toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/procesos']);
  });

  it('rechaza textos con solo espacios', () => {
    const { fixture } = crear({});
    fixture.componentInstance.form.controls.nombre.setValue('   ');
    expect(fixture.componentInstance.form.controls.nombre.invalid).toBe(true);
  });

  it('crea con los textos recortados y vuelve al listado', () => {
    const crearProceso = vi.fn(() => of(PROCESO));
    const { fixture, navegar } = crear({ crear: crearProceso });
    llenar(fixture.componentInstance);

    fixture.componentInstance.enviar();

    expect(crearProceso).toHaveBeenCalledWith({
      nombre: 'Compras',
      descripcion: 'Flujo',
      categoria: 'Finanzas',
    });
    expect(navegar).toHaveBeenCalledWith(['/procesos']);
  });

  it('con id precarga el proceso y edita', () => {
    const obtener = vi.fn(() => of({ proceso: PROCESO, historial: [] }));
    const editar = vi.fn(() => of(PROCESO));
    const { fixture, navegar } = crear({ obtener, editar }, '7');
    const componente = fixture.componentInstance;

    expect(obtener).toHaveBeenCalledWith(7);
    expect(componente.form.getRawValue()).toEqual({
      nombre: 'Compras',
      descripcion: 'Flujo de compras',
      categoria: 'Finanzas',
    });

    componente.enviar();

    expect(editar).toHaveBeenCalledWith(7, {
      nombre: 'Compras',
      descripcion: 'Flujo de compras',
      categoria: 'Finanzas',
    });
    expect(navegar).toHaveBeenCalledWith(['/procesos']);
  });

  it('avisa que un proceso publicado solo edita sus datos', () => {
    const obtener = () => of({ proceso: { ...PROCESO, estado: 'PUBLICADO' as const }, historial: [] });
    const { fixture } = crear({ obtener }, '7');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.alerta-aviso')?.textContent).toContain(
      'no el diagrama',
    );
  });

  it('muestra el detail si el proceso no existe y no pinta el formulario', () => {
    const obtener = () => throwError(() => problema(404, 'No encontrado', 'Proceso no encontrado.'));
    const { fixture } = crear({ obtener }, '99');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.alerta-error')?.textContent?.trim()).toBe('Proceso no encontrado.');
    expect(el.querySelector('form')).toBeNull();
  });

  it('pone el error de campo del 400 bajo su campo', () => {
    const err = problema(400, 'Validación fallida', 'nombre: El nombre es obligatoria.');
    const { fixture, navegar } = crear({ crear: () => throwError(() => err) });
    llenar(fixture.componentInstance);

    fixture.componentInstance.enviar();
    fixture.detectChanges();

    expect(fixture.componentInstance.erroresCampo()).toEqual({ nombre: 'El nombre es obligatoria.' });
    expect(fixture.componentInstance.error()).toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('pone el 409 de nombre repetido en la alerta', () => {
    const detail = 'Ya existe un proceso activo con el nombre "Compras" en esta empresa.';
    const { fixture } = crear({ crear: () => throwError(() => problema(409, 'Conflicto', detail)) });
    llenar(fixture.componentInstance);

    fixture.componentInstance.enviar();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.alerta-error')?.textContent?.trim()).toBe(detail);
  });
});
