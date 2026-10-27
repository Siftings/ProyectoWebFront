import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProcesosService } from '../../core/services/procesos.service';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { EstadoProceso } from '../../models/enums';
import { ProcesoDiagramaResponse } from '../../models/proceso';
import { EditorStateService } from './editor-state.service';

function diagrama(estado: EstadoProceso): ProcesoDiagramaResponse {
  return {
    proceso: {
      id: 1,
      nombre: 'Compras',
      descripcion: '',
      categoria: '',
      estado,
      activo: true,
      fechaCreacion: '2026-10-27T10:00:00',
      fechaModificacion: '2026-10-27T10:00:00',
    },
    pools: [{ id: 1, nombre: 'A', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 }],
    lanes: [{ id: 11, nombre: 'L1', orden: 0, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'R' }],
    actividades: [
      { id: 100, nombre: 'Registrar', descripcion: null, posicionX: 0, posicionY: 0, laneId: 11, tipoActividad: 'TAREA' },
      { id: 101, nombre: 'Aprobar', descripcion: null, posicionX: 200, posicionY: 0, laneId: 11, tipoActividad: 'USUARIO' },
    ],
    gateways: [],
    eventos: [],
    arcos: [{ id: 200, etiqueta: 'sí', condicion: null, origenId: 100, destinoId: 101, poolId: 1 }],
    mensajes: [],
  };
}

describe('EditorStateService', () => {
  const puedeEditar = signal(true);
  const diagramaMock = vi.fn();
  let estado: EditorStateService;

  beforeEach(() => {
    puedeEditar.set(true);
    diagramaMock.mockReset();
    TestBed.configureTestingModule({
      providers: [
        EditorStateService,
        { provide: ProcesosService, useValue: { diagrama: diagramaMock } },
        { provide: UsuarioActualService, useValue: { puedeEditar } },
      ],
    });
    estado = TestBed.inject(EditorStateService);
  });

  it('carga el diagrama, arma el árbol y suelta cargando', () => {
    diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));

    estado.cargar(1);

    expect(diagramaMock).toHaveBeenCalledWith(1);
    expect(estado.cargando()).toBe(false);
    expect(estado.arbol()[0].lanes[0].nodos).toHaveLength(2);
  });

  it('guarda el detail del error de carga', () => {
    const problema = new HttpErrorResponse({
      status: 404,
      error: { title: 'No encontrado', status: 404, detail: 'Proceso no encontrado.' },
    });
    diagramaMock.mockReturnValue(throwError(() => problema));

    estado.cargar(9);

    expect(estado.error()).toBe('Proceso no encontrado.');
    expect(estado.arbol()).toEqual([]);
  });

  it('es de solo lectura si el proceso está publicado', () => {
    diagramaMock.mockReturnValue(of(diagrama('PUBLICADO')));

    estado.cargar(1);

    expect(estado.soloLectura()).toBe(true);
    expect(estado.motivoSoloLectura()).toContain('publicado');
  });

  it('es de solo lectura si el rol no puede editar', () => {
    diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
    puedeEditar.set(false);

    estado.cargar(1);

    expect(estado.soloLectura()).toBe(true);
    expect(estado.motivoSoloLectura()).toContain('rol');
  });

  it('no es de solo lectura con un borrador y un rol que edita', () => {
    diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));

    estado.cargar(1);

    expect(estado.soloLectura()).toBe(false);
    expect(estado.motivoSoloLectura()).toBeNull();
  });

  it('resuelve el nodo y el arco seleccionados, con los nombres de sus extremos', () => {
    diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
    estado.cargar(1);

    estado.seleccionar({ tipo: 'nodo', id: 101 });
    const nodo = estado.seleccionado();
    expect(nodo?.tipo === 'nodo' && nodo.nodo.nombre).toBe('Aprobar');

    estado.seleccionar({ tipo: 'arco', id: 200 });
    const arco = estado.seleccionado();
    expect(arco?.tipo === 'arco' && [arco.origen, arco.destino]).toEqual(['Registrar', 'Aprobar']);

    estado.seleccionar(null);
    expect(estado.seleccionado()).toBeNull();
  });
});
