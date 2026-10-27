// Geometría del diagrama: cajas de pools, lanes y nodos en coordenadas absolutas del SVG.
// La posición de un nodo es relativa a la esquina superior izquierda de su lane.
import { NodoDiagrama, PoolArbol } from './diagrama-arbol';

export const MARGEN = 20;
export const ESPACIO_TITULO_POOL = 24;
export const CABECERA_POOL = 40;
export const LANE_ALTO_MIN = 150;
export const ANCHO_MIN = 800;
export const POOL_SIN_LANES_ALTO = 80;
const HOLGURA_ANCHO = 40;
const HOLGURA_ALTO = 20;

export interface Punto {
  x: number;
  y: number;
}

export interface Caja extends Punto {
  ancho: number;
  alto: number;
}

export interface LayoutDiagrama {
  ancho: number;
  alto: number;
  pools: Map<number, Caja>;
  lanes: Map<number, Caja>;
  nodos: Map<number, Caja>;
}

export function tamanoNodo(kind: NodoDiagrama['kind']): { ancho: number; alto: number } {
  switch (kind) {
    case 'actividad':
      return { ancho: 130, alto: 66 };
    case 'gateway':
      return { ancho: 46, alto: 46 };
    case 'evento':
      return { ancho: 36, alto: 36 };
  }
}

export function calcularLayout(arbol: PoolArbol[]): LayoutDiagrama {
  const todos = arbol.flatMap((p) => p.lanes.flatMap((l) => l.nodos));
  const laneAncho = Math.max(
    ANCHO_MIN,
    ...todos.map((n) => n.posicionX + tamanoNodo(n.kind).ancho + HOLGURA_ANCHO),
  );

  const pools = new Map<number, Caja>();
  const lanes = new Map<number, Caja>();
  const nodos = new Map<number, Caja>();
  let cursor = MARGEN;

  for (const { pool, lanes: lanesPool } of arbol) {
    const y = cursor + ESPACIO_TITULO_POOL;
    let yLane = y;
    for (const { lane, nodos: nodosLane } of lanesPool) {
      const alto = Math.max(
        LANE_ALTO_MIN,
        ...nodosLane.map((n) => n.posicionY + tamanoNodo(n.kind).alto + HOLGURA_ALTO),
      );
      const caja: Caja = { x: MARGEN + CABECERA_POOL, y: yLane, ancho: laneAncho, alto };
      lanes.set(lane.id, caja);
      for (const n of nodosLane) {
        nodos.set(n.id, {
          x: caja.x + n.posicionX,
          y: caja.y + n.posicionY,
          ...tamanoNodo(n.kind),
        });
      }
      yLane += alto;
    }
    const altoPool = lanesPool.length > 0 ? yLane - y : POOL_SIN_LANES_ALTO;
    pools.set(pool.id, { x: MARGEN, y, ancho: CABECERA_POOL + laneAncho, alto: altoPool });
    cursor = y + altoPool + MARGEN;
  }

  return { ancho: MARGEN * 2 + CABECERA_POOL + laneAncho, alto: cursor, pools, lanes, nodos };
}

export function puntoBorde(caja: Caja, hacia: Punto): Punto {
  const cx = caja.x + caja.ancho / 2;
  const cy = caja.y + caja.alto / 2;
  const dx = hacia.x - cx;
  const dy = hacia.y - cy;
  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy };
  }
  const escala = Math.min(
    dx === 0 ? Infinity : caja.ancho / 2 / Math.abs(dx),
    dy === 0 ? Infinity : caja.alto / 2 / Math.abs(dy),
  );
  return { x: cx + dx * escala, y: cy + dy * escala };
}
