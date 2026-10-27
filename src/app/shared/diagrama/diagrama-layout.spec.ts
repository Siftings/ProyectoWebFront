import { PoolArbol } from './diagrama-arbol';
import {
  CABECERA_POOL,
  ESPACIO_TITULO_POOL,
  LANE_ALTO_MIN,
  MARGEN,
  POOL_SIN_LANES_ALTO,
  calcularLayout,
  puntoBorde,
} from './diagrama-layout';

function pool(id: number, lanes: PoolArbol['lanes']): PoolArbol {
  return {
    pool: { id, nombre: `P${id}`, tipoParticipante: 'EMPRESA', cajaNegra: false, orden: id, procesoId: 1 },
    lanes,
    arcos: [],
  };
}

function lane(id: number, poolId: number, nodos: PoolArbol['lanes'][number]['nodos'] = []) {
  return {
    lane: { id, nombre: `L${id}`, orden: id, poolId, rolProcesoId: 1, rolProcesoNombre: 'R' },
    nodos,
  };
}

function actividad(id: number, laneId: number, x: number, y: number) {
  return {
    kind: 'actividad' as const,
    id,
    nombre: `A${id}`,
    descripcion: null,
    posicionX: x,
    posicionY: y,
    laneId,
    tipoActividad: 'TAREA' as const,
  };
}

describe('calcularLayout', () => {
  it('apila los pools con su título encima y las lanes dentro', () => {
    const layout = calcularLayout([pool(1, [lane(11, 1), lane(12, 1)]), pool(2, [lane(21, 2)])]);

    expect(layout.pools.get(1)).toEqual({
      x: MARGEN,
      y: MARGEN + ESPACIO_TITULO_POOL,
      ancho: layout.pools.get(1)!.ancho,
      alto: LANE_ALTO_MIN * 2,
    });
    expect(layout.lanes.get(11)!.y).toBe(layout.pools.get(1)!.y);
    expect(layout.lanes.get(12)!.y).toBe(layout.lanes.get(11)!.y + LANE_ALTO_MIN);
    expect(layout.lanes.get(11)!.x).toBe(MARGEN + CABECERA_POOL);
    expect(layout.pools.get(2)!.y).toBe(
      layout.pools.get(1)!.y + LANE_ALTO_MIN * 2 + MARGEN + ESPACIO_TITULO_POOL,
    );
    expect(layout.alto).toBe(layout.pools.get(2)!.y + LANE_ALTO_MIN + MARGEN);
  });

  it('da una banda fija a un pool sin lanes', () => {
    const layout = calcularLayout([pool(1, [])]);

    expect(layout.pools.get(1)!.alto).toBe(POOL_SIN_LANES_ALTO);
  });

  it('pone el nodo en coordenadas absolutas: lane más su posición', () => {
    const layout = calcularLayout([pool(1, [lane(11, 1, [actividad(100, 11, 30, 40)])])]);

    const l = layout.lanes.get(11)!;
    expect(layout.nodos.get(100)).toEqual({ x: l.x + 30, y: l.y + 40, ancho: 130, alto: 66 });
  });

  it('crece el alto de la lane y el ancho común si un nodo no cabe', () => {
    const layout = calcularLayout([
      pool(1, [lane(11, 1, [actividad(100, 11, 900, 200)]), lane(12, 1)]),
    ]);

    expect(layout.lanes.get(11)!.alto).toBe(200 + 66 + 20);
    expect(layout.lanes.get(12)!.alto).toBe(LANE_ALTO_MIN);
    expect(layout.lanes.get(11)!.ancho).toBe(900 + 130 + 40);
    expect(layout.lanes.get(12)!.ancho).toBe(layout.lanes.get(11)!.ancho);
  });
});

describe('puntoBorde', () => {
  const caja = { x: 100, y: 100, ancho: 100, alto: 60 };

  it('sale por los cuatro lados', () => {
    expect(puntoBorde(caja, { x: 400, y: 130 })).toEqual({ x: 200, y: 130 });
    expect(puntoBorde(caja, { x: 0, y: 130 })).toEqual({ x: 100, y: 130 });
    expect(puntoBorde(caja, { x: 150, y: 0 })).toEqual({ x: 150, y: 100 });
    expect(puntoBorde(caja, { x: 150, y: 400 })).toEqual({ x: 150, y: 160 });
  });

  it('devuelve el centro si el destino es el mismo punto', () => {
    expect(puntoBorde(caja, { x: 150, y: 130 })).toEqual({ x: 150, y: 130 });
  });
});
