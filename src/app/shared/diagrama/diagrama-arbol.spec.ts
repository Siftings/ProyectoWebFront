import { DiagramaBase } from '../../models/proceso';
import { armarArbol } from './diagrama-arbol';

const BASE: DiagramaBase = {
  proceso: {
    id: 1,
    nombre: 'Compras',
    descripcion: '',
    categoria: '',
    estado: 'BORRADOR',
    activo: true,
    fechaCreacion: '2026-10-27T10:00:00',
    fechaModificacion: '2026-10-27T10:00:00',
  },
  pools: [],
  lanes: [],
  actividades: [],
  gateways: [],
  eventos: [],
  arcos: [],
  mensajes: [],
};

function diagrama(parcial: Partial<DiagramaBase>): DiagramaBase {
  return { ...BASE, ...parcial };
}

describe('armarArbol', () => {
  it('devuelve una lista vacía sin pools', () => {
    expect(armarArbol(BASE)).toEqual([]);
  });

  it('ordena pools y lanes por orden', () => {
    const d = diagrama({
      pools: [
        { id: 2, nombre: 'B', tipoParticipante: 'CLIENTE', cajaNegra: false, orden: 1, procesoId: 1 },
        { id: 1, nombre: 'A', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 },
      ],
      lanes: [
        { id: 12, nombre: 'L2', orden: 1, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'R' },
        { id: 11, nombre: 'L1', orden: 0, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'R' },
      ],
    });

    const arbol = armarArbol(d);

    expect(arbol.map((p) => p.pool.id)).toEqual([1, 2]);
    expect(arbol[0].lanes.map((l) => l.lane.id)).toEqual([11, 12]);
    expect(arbol[1].lanes).toEqual([]);
  });

  it('pone cada nodo en su lane con su tipo y cada arco en su pool', () => {
    const d = diagrama({
      pools: [
        { id: 1, nombre: 'A', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 },
        { id: 2, nombre: 'B', tipoParticipante: 'CLIENTE', cajaNegra: false, orden: 1, procesoId: 1 },
      ],
      lanes: [
        { id: 11, nombre: 'L1', orden: 0, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'R' },
        { id: 21, nombre: 'L2', orden: 0, poolId: 2, rolProcesoId: 1, rolProcesoNombre: 'R' },
      ],
      actividades: [
        { id: 100, nombre: 'Registrar', descripcion: null, posicionX: 10, posicionY: 20, laneId: 11, tipoActividad: 'TAREA' },
      ],
      gateways: [{ id: 101, nombre: 'Decide', tipoGateway: 'EXCLUSIVO', posicionX: 0, posicionY: 0, laneId: 11 }],
      eventos: [
        {
          id: 102,
          nombre: 'Pedido',
          tipoEvento: 'CATCH_INICIO',
          contenido: '',
          claveCorrelacion: 'k',
          posicionX: 0,
          posicionY: 0,
          laneId: 21,
          origenExterno: false,
        },
      ],
      arcos: [{ id: 200, etiqueta: null, condicion: null, origenId: 100, destinoId: 101, poolId: 1 }],
    });

    const arbol = armarArbol(d);

    expect(arbol[0].lanes[0].nodos.map((n) => [n.id, n.kind])).toEqual([
      [100, 'actividad'],
      [101, 'gateway'],
    ]);
    expect(arbol[1].lanes[0].nodos.map((n) => [n.id, n.kind])).toEqual([[102, 'evento']]);
    expect(arbol[0].arcos.map((a) => a.id)).toEqual([200]);
    expect(arbol[1].arcos).toEqual([]);
  });

  it('no cambia el orden de la respuesta original', () => {
    const d = diagrama({
      pools: [
        { id: 2, nombre: 'B', tipoParticipante: 'CLIENTE', cajaNegra: false, orden: 1, procesoId: 1 },
        { id: 1, nombre: 'A', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 },
      ],
    });

    armarArbol(d);

    expect(d.pools.map((p) => p.id)).toEqual([2, 1]);
  });
});
