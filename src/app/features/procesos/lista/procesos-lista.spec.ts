import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProcesosService } from '../../../core/services/procesos.service';
import { UsuarioActualService } from '../../../core/services/usuario-actual.service';
import { PageResponse } from '../../../models/comun';
import { RolAcceso } from '../../../models/enums';
import { ProcesoResponse } from '../../../models/proceso';
import { ProcesosLista } from './procesos-lista';

function proceso(id: number, estado: ProcesoResponse['estado'] = 'BORRADOR'): ProcesoResponse {
  return {
    id,
    nombre: `Proceso ${id}`,
    descripcion: 'desc',
    categoria: 'Finanzas',
    estado,
    activo: true,
    fechaCreacion: '2026-10-26T10:00:00',
    fechaModificacion: '2026-10-26T10:00:00',
  };
}

function pagina(content: ProcesoResponse[], page = 0, totalPages = 1): PageResponse<ProcesoResponse> {
  return { content, page, size: 10, totalElements: content.length, totalPages };
}

function crear(rol: RolAcceso, servicio: Partial<Record<keyof ProcesosService, unknown>>) {
  const esAdmin = rol === 'ADMINISTRADOR';
  TestBed.configureTestingModule({
    imports: [ProcesosLista],
    providers: [
      provideRouter([]),
      { provide: ProcesosService, useValue: servicio },
      {
        provide: UsuarioActualService,
        useValue: { esAdmin: signal(esAdmin), puedeEditar: signal(esAdmin || rol === 'EDITOR') },
      },
    ],
  });
  const fixture = TestBed.createComponent(ProcesosLista);
  fixture.detectChanges();
  return fixture;
}

function textos(fixture: ReturnType<typeof crear>, selector: string): string[] {
  const el: HTMLElement = fixture.nativeElement;
  return Array.from(el.querySelectorAll(selector)).map((n) => n.textContent?.trim() ?? '');
}

describe('ProcesosLista', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement): void {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement): void {
      this.open = false;
    };
  });

  it('carga la primera página al abrir', () => {
    const listar = vi.fn(() => of(pagina([proceso(1)])));
    const fixture = crear('ADMINISTRADOR', { listar });
    expect(listar).toHaveBeenCalledWith({}, 0);
    expect(textos(fixture, 'tbody td:first-child')).toEqual(['Proceso 1']);
  });

  it('SOLO_LECTURA no ve acciones ni el botón de nuevo', () => {
    const fixture = crear('SOLO_LECTURA', { listar: () => of(pagina([proceso(1)])) });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Nuevo proceso');
    expect(el.querySelector('td.acciones')?.children.length).toBe(0);
  });

  it('EDITOR edita y publica pero no elimina', () => {
    const fixture = crear('EDITOR', { listar: () => of(pagina([proceso(1)])) });
    expect(textos(fixture, 'td.acciones > *')).toEqual(['Editar', 'Publicar']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nuevo proceso');
  });

  it('ADMINISTRADOR ve eliminar y no ve publicar en un proceso publicado', () => {
    const fixture = crear('ADMINISTRADOR', { listar: () => of(pagina([proceso(1, 'PUBLICADO')])) });
    expect(textos(fixture, 'td.acciones > *')).toEqual(['Editar', 'Eliminar']);
  });

  it('buscar manda los filtros recortados y vuelve a la página 0', () => {
    const listar = vi.fn(() => of(pagina([proceso(1)], 0, 3)));
    const fixture = crear('ADMINISTRADOR', { listar });
    const componente = fixture.componentInstance;
    componente.cargar(2);
    componente.form.setValue({ nombre: ' comp ', estado: 'PUBLICADO', categoria: ' ', vista: 'eliminados' });

    componente.buscar();

    expect(listar).toHaveBeenLastCalledWith({ nombre: 'comp', estado: 'PUBLICADO', activo: false }, 0);
  });

  it('muestra el detail si el listado falla', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { type: 'x', title: 'Solicitud', status: 400, detail: 'Página inválida', instance: '/' },
    });
    const fixture = crear('ADMINISTRADOR', { listar: () => throwError(() => err) });
    expect(textos(fixture, '.alerta-error')).toEqual(['Página inválida']);
  });

  it('si un listado nuevo falla, quita la tabla anterior', () => {
    let fallar = false;
    const err = new HttpErrorResponse({ status: 0 });
    const listar = vi.fn(() => (fallar ? throwError(() => err) : of(pagina([proceso(1)]))));
    const fixture = crear('ADMINISTRADOR', { listar });
    fallar = true;
    fixture.componentInstance.cargar(0);
    fixture.detectChanges();
    expect(fixture.componentInstance.resultado()).toBeNull();
    expect(textos(fixture, 'tbody tr')).toEqual([]);
    expect(textos(fixture, '.alerta-error')).toEqual(['No se pudo conectar con el servidor.']);
  });

  it('las acciones siguen la vista mostrada y no la del formulario', () => {
    const listar = vi.fn(() => of(pagina([proceso(1)])));
    const fixture = crear('ADMINISTRADOR', { listar });
    fixture.componentInstance.form.controls.vista.setValue('eliminados');
    fixture.detectChanges();
    expect(textos(fixture, 'td.acciones > *')).toEqual(['Editar', 'Publicar', 'Eliminar']);
  });

  it('pide la página anterior si la actual queda vacía', () => {
    const listar = vi.fn((_f: unknown, p: number) =>
      of(p === 1 ? pagina([], 1, 1) : pagina([proceso(1)], 0, 1)),
    );
    const fixture = crear('ADMINISTRADOR', { listar });
    fixture.componentInstance.cargar(1);
    expect(listar).toHaveBeenLastCalledWith({}, 0);
    expect(fixture.componentInstance.pagina()).toBe(0);
  });

  it('eliminar pide confirmación, llama al servicio y recarga la página actual', () => {
    const listar = vi.fn(() => of(pagina([proceso(1)])));
    const eliminar = vi.fn(() => of(undefined));
    const fixture = crear('ADMINISTRADOR', { listar, eliminar });
    const componente = fixture.componentInstance;

    componente.pedir('eliminar', proceso(1));
    expect(eliminar).not.toHaveBeenCalled();
    componente.confirmar();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(1);
    expect(listar).toHaveBeenCalledTimes(2);
    expect(textos(fixture, '.alerta-exito')).toEqual(['Proceso eliminado.']);
    expect(componente.pendiente()).toBeNull();
  });

  it('publicar avisa que no hay vuelta atrás y muestra el detail de un 409', () => {
    const err = new HttpErrorResponse({
      status: 409,
      error: {
        type: 'x',
        title: 'Conflicto',
        status: 409,
        detail: 'El mensaje "M" debe tener un Message Throw asociado.',
        instance: '/',
      },
    });
    const publicar = vi.fn(() => throwError(() => err));
    const fixture = crear('EDITOR', { listar: () => of(pagina([proceso(1)])), publicar });
    const componente = fixture.componentInstance;

    componente.pedir('publicar', proceso(1));
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('dialog')?.textContent).toContain(
      'no puede volver a borrador',
    );
    componente.confirmar();
    fixture.detectChanges();

    expect(publicar).toHaveBeenCalledWith(1);
    expect(textos(fixture, '.alerta-error')).toEqual(['El mensaje "M" debe tener un Message Throw asociado.']);
  });

  it('cancelar la confirmación no llama al servicio', () => {
    const eliminar = vi.fn();
    const fixture = crear('ADMINISTRADOR', { listar: () => of(pagina([proceso(1)])), eliminar });
    fixture.componentInstance.pedir('eliminar', proceso(1));
    fixture.componentInstance.pendiente.set(null);
    fixture.componentInstance.confirmar();
    expect(eliminar).not.toHaveBeenCalled();
  });
});
