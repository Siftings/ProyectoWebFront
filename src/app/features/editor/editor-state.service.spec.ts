import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ArcosService } from '../../core/services/arcos.service';
import { LanesService } from '../../core/services/lanes.service';
import { PermisosEstructuraService } from '../../core/services/permisos-estructura.service';
import { NodosService } from '../../core/services/nodos.service';
import { PoolsService } from '../../core/services/pools.service';
import { ProcesosService } from '../../core/services/procesos.service';
import { UsuarioActualService } from '../../core/services/usuario-actual.service';
import { EstadoProceso, RolAcceso } from '../../models/enums';
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
    pools: [
      { id: 1, nombre: 'A', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 },
    ],
    lanes: [{ id: 11, nombre: 'L1', orden: 0, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'R' }],
    actividades: [
      {
        id: 100,
        nombre: 'Registrar',
        descripcion: null,
        posicionX: 0,
        posicionY: 0,
        laneId: 11,
        tipoActividad: 'TAREA',
      },
      {
        id: 101,
        nombre: 'Aprobar',
        descripcion: null,
        posicionX: 200,
        posicionY: 0,
        laneId: 11,
        tipoActividad: 'USUARIO',
      },
    ],
    gateways: [],
    eventos: [],
    arcos: [{ id: 200, etiqueta: 'sí', condicion: null, origenId: 100, destinoId: 101, poolId: 1 }],
    mensajes: [],
  };
}

describe('EditorStateService', () => {
  const puedeEditar = signal(true);
  const rol = signal<RolAcceso>('ADMINISTRADOR');
  const diagramaMock = vi.fn();
  const reordenarMock = vi.fn();
  const eliminarLaneMock = vi.fn();
  const eliminarPoolMock = vi.fn();
  const listarPermisosMock = vi.fn();
  const editarNodoMock = vi.fn();
  const eliminarNodoMock = vi.fn();
  const impactoNodoMock = vi.fn();
  const eliminarArcoMock = vi.fn();
  const impactoArcoMock = vi.fn();
  let estado: EditorStateService;

  beforeEach(() => {
    puedeEditar.set(true);
    rol.set('ADMINISTRADOR');
    diagramaMock.mockReset();
    reordenarMock.mockReset();
    eliminarLaneMock.mockReset();
    eliminarPoolMock.mockReset();
    listarPermisosMock.mockReset();
    editarNodoMock.mockReset();
    eliminarNodoMock.mockReset();
    impactoNodoMock.mockReset();
    eliminarArcoMock.mockReset();
    impactoArcoMock.mockReset();
    listarPermisosMock.mockReturnValue(of([]));
    TestBed.configureTestingModule({
      providers: [
        EditorStateService,
        { provide: ProcesosService, useValue: { diagrama: diagramaMock } },
        { provide: PoolsService, useValue: { eliminar: eliminarPoolMock } },
        {
          provide: NodosService,
          useValue: {
            editar: editarNodoMock,
            eliminar: eliminarNodoMock,
            impacto: impactoNodoMock,
          },
        },
        {
          provide: ArcosService,
          useValue: { eliminar: eliminarArcoMock, impacto: impactoArcoMock },
        },
        {
          provide: LanesService,
          useValue: { reordenar: reordenarMock, eliminar: eliminarLaneMock },
        },
        { provide: PermisosEstructuraService, useValue: { listar: listarPermisosMock } },
        {
          provide: UsuarioActualService,
          useValue: { puedeEditar, rol, esAdmin: () => rol() === 'ADMINISTRADOR' },
        },
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

  describe('pools y lanes', () => {
    function conDosLanes(): ProcesoDiagramaResponse {
      const d = diagrama('BORRADOR');
      d.lanes.push({
        id: 12,
        nombre: 'L2',
        orden: 1,
        poolId: 1,
        rolProcesoId: 1,
        rolProcesoNombre: 'R',
      });
      return d;
    }

    it('calcula los permisos según el rol y las filas del administrador', () => {
      listarPermisosMock.mockReturnValue(
        of([
          {
            rolAcceso: 'ADMINISTRADOR',
            crearPool: false,
            editarPool: true,
            eliminarPool: true,
            crearLane: true,
            editarLane: true,
            eliminarLane: true,
          },
        ]),
      );
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          EditorStateService,
          { provide: ProcesosService, useValue: { diagrama: diagramaMock } },
          { provide: PoolsService, useValue: {} },
          { provide: NodosService, useValue: {} },
          { provide: LanesService, useValue: {} },
          { provide: PermisosEstructuraService, useValue: { listar: listarPermisosMock } },
          { provide: UsuarioActualService, useValue: { puedeEditar, rol, esAdmin: () => true } },
        ],
      });
      const e = TestBed.inject(EditorStateService);

      expect(e.permisos().crearPool).toBe(false);
      expect(e.permisos().eliminarPool).toBe(true);
    });

    it('el editor no pide los permisos y no puede eliminar', () => {
      rol.set('EDITOR');
      listarPermisosMock.mockClear();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          EditorStateService,
          { provide: ProcesosService, useValue: { diagrama: diagramaMock } },
          { provide: PoolsService, useValue: {} },
          { provide: NodosService, useValue: {} },
          { provide: LanesService, useValue: {} },
          { provide: PermisosEstructuraService, useValue: { listar: listarPermisosMock } },
          { provide: UsuarioActualService, useValue: { puedeEditar, rol, esAdmin: () => false } },
        ],
      });
      const e = TestBed.inject(EditorStateService);

      expect(listarPermisosMock).not.toHaveBeenCalled();
      expect(e.permisos().crearPool).toBe(true);
      expect(e.permisos().eliminarLane).toBe(false);
    });

    it('moverLane manda el orden nuevo y recarga el diagrama', () => {
      diagramaMock.mockReturnValue(of(conDosLanes()));
      reordenarMock.mockReturnValue(of([]));
      estado.cargar(1);

      estado.moverLane(12, -1);

      expect(reordenarMock).toHaveBeenCalledWith(1, [12, 11]);
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('moverLane no hace nada si la lane no se puede mover', () => {
      diagramaMock.mockReturnValue(of(conDosLanes()));
      estado.cargar(1);

      estado.moverLane(11, -1);

      expect(reordenarMock).not.toHaveBeenCalled();
    });

    it('eliminar un pool limpia la selección y recarga', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      eliminarPoolMock.mockReturnValue(of(undefined));
      estado.cargar(1);
      estado.seleccionar({ tipo: 'pool', id: 1 });

      estado.eliminar('pool', 1);

      expect(eliminarPoolMock).toHaveBeenCalledWith(1);
      expect(estado.seleccion()).toBeNull();
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('guarda el detail del error de una acción', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      eliminarLaneMock.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: {
                title: 'Conflicto',
                status: 409,
                detail: 'La lane "L1" contiene elementos activos.',
              },
            }),
        ),
      );
      estado.cargar(1);

      estado.eliminar('lane', 11);

      expect(estado.errorAccion()).toBe('La lane "L1" contiene elementos activos.');
    });

    it('recargar conserva la selección y cargar la limpia', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      estado.cargar(1);
      estado.seleccionar({ tipo: 'nodo', id: 100 });

      estado.recargar();
      expect(estado.seleccion()).toEqual({ tipo: 'nodo', id: 100 });

      estado.cargar(1);
      expect(estado.seleccion()).toBeNull();
    });

    it('guardado cierra el alta, selecciona lo guardado y recarga', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      estado.cargar(1);
      estado.nuevaLane(1);

      estado.guardado({ tipo: 'lane', id: 11 });

      expect(estado.creando()).toBeNull();
      expect(estado.seleccion()).toEqual({ tipo: 'lane', id: 11 });
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('nodos', () => {
    it('puedeEliminarFlujo es falso para un editor y con el proceso publicado', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      estado.cargar(1);
      expect(estado.puedeModelar()).toBe(true);
      expect(estado.puedeEliminarFlujo()).toBe(true);

      rol.set('EDITOR');
      expect(estado.puedeEliminarFlujo()).toBe(false);

      rol.set('ADMINISTRADOR');
      diagramaMock.mockReturnValue(of(diagrama('PUBLICADO')));
      estado.cargar(1);
      expect(estado.puedeModelar()).toBe(false);
      expect(estado.puedeEliminarFlujo()).toBe(false);
    });

    it('moverNodo manda el PUT completo del nodo y recarga', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      editarNodoMock.mockReturnValue(of({}));
      estado.cargar(1);

      estado.moverNodo({ id: 101, posicionX: 250, posicionY: 30 });

      expect(editarNodoMock).toHaveBeenCalledWith('actividad', 101, {
        nombre: 'Aprobar',
        descripcion: undefined,
        tipoActividad: 'USUARIO',
        posicionX: 250,
        posicionY: 30,
      });
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('moverNodo guarda el detail del error y recarga', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      editarNodoMock.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { title: 'Conflicto', status: 409, detail: 'El proceso está publicado.' },
            }),
        ),
      );
      estado.cargar(1);

      estado.moverNodo({ id: 100, posicionX: 5, posicionY: 5 });

      expect(estado.errorAccion()).toBe('El proceso está publicado.');
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('eliminarNodo llama al servicio con su tipo, limpia la selección y recarga', () => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      eliminarNodoMock.mockReturnValue(of(undefined));
      estado.cargar(1);
      estado.seleccionar({ tipo: 'nodo', id: 100 });

      estado.eliminarNodo('actividad', 100);

      expect(eliminarNodoMock).toHaveBeenCalledWith('actividad', 100);
      expect(estado.seleccion()).toBeNull();
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('advertenciasNodo entrega las advertencias del impacto', () => {
      impactoNodoMock.mockReturnValue(
        of({
          requiereConfirmacion: true,
          rompeContinuidad: true,
          advertencias: ['Rompe el flujo.'],
        }),
      );
      const alResolver = vi.fn();

      estado.advertenciasNodo('gateway', 4, alResolver);

      expect(impactoNodoMock).toHaveBeenCalledWith('gateway', 4);
      expect(alResolver).toHaveBeenCalledWith(['Rompe el flujo.']);
    });

    it('nuevoNodo abre el alta del tipo en la lane', () => {
      estado.nuevoNodo('evento', 11);

      expect(estado.creando()).toEqual({ tipo: 'nodo', kind: 'evento', laneId: 11 });
    });
  });

  describe('arcos', () => {
    beforeEach(() => {
      diagramaMock.mockReturnValue(of(diagrama('BORRADOR')));
      estado.cargar(1);
    });

    it('nuevoArco abre el alta con el origen y sin destino', () => {
      estado.nuevoArco(100);

      expect(estado.creando()).toEqual({ tipo: 'arco', origenId: 100, destinoId: null });
      expect(estado.altaArco()?.origen.id).toBe(100);
    });

    it('en modo conexión, un nodo válido fija el destino y conserva la selección', () => {
      estado.seleccionar({ tipo: 'nodo', id: 100 });
      estado.nuevoArco(101);

      estado.seleccionar({ tipo: 'nodo', id: 100 });

      expect(estado.creando()).toEqual({ tipo: 'arco', origenId: 101, destinoId: 100 });
      expect(estado.seleccion()).toEqual({ tipo: 'nodo', id: 100 });
    });

    it('en modo conexión, un nodo no válido o una lane cancelan el alta', () => {
      estado.nuevoArco(100);
      estado.seleccionar({ tipo: 'nodo', id: 101 });
      expect(estado.creando()).toBeNull();

      estado.nuevoArco(101);
      estado.seleccionar({ tipo: 'lane', id: 11 });
      expect(estado.creando()).toBeNull();
      expect(estado.seleccion()).toEqual({ tipo: 'lane', id: 11 });
    });

    it('advertenciasArco entrega las advertencias del impacto', () => {
      impactoArcoMock.mockReturnValue(
        of({ requiereConfirmacion: true, rompeContinuidad: true, advertencias: ['Sin salida.'] }),
      );
      const alResolver = vi.fn();

      estado.advertenciasArco(200, alResolver);

      expect(impactoArcoMock).toHaveBeenCalledWith(200);
      expect(alResolver).toHaveBeenCalledWith(['Sin salida.']);
    });

    it('eliminarArco llama al servicio, limpia la selección y recarga', () => {
      eliminarArcoMock.mockReturnValue(of(undefined));
      estado.seleccionar({ tipo: 'arco', id: 200 });

      estado.eliminarArco(200);

      expect(eliminarArcoMock).toHaveBeenCalledWith(200);
      expect(estado.seleccion()).toBeNull();
      expect(diagramaMock).toHaveBeenCalledTimes(2);
    });

    it('eliminarArco guarda el detail del error', () => {
      eliminarArcoMock.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { title: 'No encontrado', status: 404, detail: 'Arco no encontrado.' },
            }),
        ),
      );

      estado.eliminarArco(200);

      expect(estado.errorAccion()).toBe('Arco no encontrado.');
    });
  });
});
