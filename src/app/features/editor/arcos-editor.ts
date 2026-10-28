// Lógica pura de arcos del editor: condición obligatoria, destinos posibles y requests de alta y edición.
import { ArcoRequest, EditarArcoRequest } from '../../models/arco';
import { NodoDiagrama, PoolArbol } from '../../shared/diagrama/diagrama-arbol';

export function requiereCondicion(origen: NodoDiagrama): boolean {
  return (
    origen.kind === 'gateway' &&
    (origen.tipoGateway === 'EXCLUSIVO' || origen.tipoGateway === 'INCLUSIVO')
  );
}

export function destinosPosibles(arbol: PoolArbol[], origenId: number): NodoDiagrama[] {
  const pool = arbol.find((p) => p.lanes.some((l) => l.nodos.some((n) => n.id === origenId)));
  if (!pool) {
    return [];
  }
  const conectados = new Set(
    pool.arcos.filter((a) => a.origenId === origenId).map((a) => a.destinoId),
  );
  return pool.lanes
    .flatMap((l) => l.nodos)
    .filter(
      (n) =>
        n.id !== origenId &&
        !conectados.has(n.id) &&
        !(n.kind === 'evento' && n.tipoEvento === 'CATCH_INICIO'),
    );
}

export function requestCrearArco(
  origenId: number,
  destinoId: number,
  etiqueta: string,
  condicion: string,
): ArcoRequest {
  const req: ArcoRequest = { origenId, destinoId };
  if (etiqueta.trim()) {
    req.etiqueta = etiqueta.trim();
  }
  if (condicion.trim()) {
    req.condicion = condicion.trim();
  }
  return req;
}

export function requestEditarArco(etiqueta: string, condicion: string): EditarArcoRequest {
  return { etiqueta: etiqueta.trim(), condicion: condicion.trim() };
}
