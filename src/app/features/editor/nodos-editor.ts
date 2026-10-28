// Lógica pura de nodos del editor: request de un PUT que solo cambia la posición y posición de un nodo nuevo.
import { ActividadRequest, EventoMensajeRequest, GatewayRequest } from '../../models/nodo';
import { NodoDiagrama } from '../../shared/diagrama/diagrama-arbol';
import { Punto, tamanoNodo } from '../../shared/diagrama/diagrama-layout';

const SEPARACION = 40;

export type PeticionNodo =
  | { kind: 'actividad'; req: ActividadRequest }
  | { kind: 'gateway'; req: GatewayRequest }
  | { kind: 'evento'; req: EventoMensajeRequest };

export function requestPosicion(nodo: NodoDiagrama, x: number, y: number): PeticionNodo {
  switch (nodo.kind) {
    case 'actividad':
      return {
        kind: 'actividad',
        req: {
          nombre: nodo.nombre,
          descripcion: nodo.descripcion ?? undefined,
          tipoActividad: nodo.tipoActividad,
          posicionX: x,
          posicionY: y,
        },
      };
    case 'gateway':
      return {
        kind: 'gateway',
        req: { nombre: nodo.nombre, tipoGateway: nodo.tipoGateway, posicionX: x, posicionY: y },
      };
    case 'evento':
      return {
        kind: 'evento',
        req: {
          nombre: nodo.nombre,
          tipoEvento: nodo.tipoEvento,
          contenido: nodo.contenido,
          claveCorrelacion: nodo.claveCorrelacion,
          origenExterno: nodo.origenExterno,
          posicionX: x,
          posicionY: y,
        },
      };
  }
}

export function posicionNueva(nodos: readonly NodoDiagrama[]): Punto {
  const derecha = nodos.map((n) => n.posicionX + tamanoNodo(n.kind).ancho + SEPARACION);
  return { x: Math.max(SEPARACION, ...derecha), y: SEPARACION };
}
