// Árbol pool → lane → nodos del diagrama (contrato 9.4). No muta la respuesta del back.
import { ArcoResponse } from '../../models/arco';
import {
  ETIQUETAS_TIPO_ACTIVIDAD,
  ETIQUETAS_TIPO_EVENTO,
  ETIQUETAS_TIPO_GATEWAY,
} from '../../models/enums';
import { ActividadResponse, EventoMensajeResponse, GatewayResponse } from '../../models/nodo';
import { DiagramaBase } from '../../models/proceso';
import { LaneResponse, PoolResponse } from '../../models/pool-lane';

export type NodoDiagrama =
  | ({ kind: 'actividad' } & ActividadResponse)
  | ({ kind: 'gateway' } & GatewayResponse)
  | ({ kind: 'evento' } & EventoMensajeResponse);

export interface LaneArbol {
  lane: LaneResponse;
  nodos: NodoDiagrama[];
}

export interface PoolArbol {
  pool: PoolResponse;
  lanes: LaneArbol[];
  arcos: ArcoResponse[];
}

export type Seleccion = { tipo: 'pool' | 'lane' | 'nodo' | 'arco' | 'mensaje'; id: number } | null;

export function tipoNodo(n: NodoDiagrama): string {
  switch (n.kind) {
    case 'actividad':
      return ETIQUETAS_TIPO_ACTIVIDAD[n.tipoActividad];
    case 'gateway':
      return ETIQUETAS_TIPO_GATEWAY[n.tipoGateway];
    case 'evento':
      return ETIQUETAS_TIPO_EVENTO[n.tipoEvento];
  }
}

export function armarArbol(d: DiagramaBase): PoolArbol[] {
  const nodos: NodoDiagrama[] = [
    ...d.actividades.map((n) => ({ ...n, kind: 'actividad' as const })),
    ...d.gateways.map((n) => ({ ...n, kind: 'gateway' as const })),
    ...d.eventos.map((n) => ({ ...n, kind: 'evento' as const })),
  ];
  return [...d.pools]
    .sort((a, b) => a.orden - b.orden)
    .map((pool) => ({
      pool,
      lanes: d.lanes
        .filter((l) => l.poolId === pool.id)
        .sort((a, b) => a.orden - b.orden)
        .map((lane) => ({ lane, nodos: nodos.filter((n) => n.laneId === lane.id) })),
      arcos: d.arcos.filter((a) => a.poolId === pool.id),
    }));
}
