// Lógica pura de mensajes del editor: receptores posibles, extremos de un mensaje y requests de alta y edición.
import { EditarMensajeRequest, MensajeRequest, MensajeResponse } from '../../models/mensaje';
import { PoliticaMensajeSinCaso } from '../../models/enums';
import { NodoDiagrama, PoolArbol } from '../../shared/diagrama/diagrama-arbol';

export type NodoEvento = Extract<NodoDiagrama, { kind: 'evento' }>;

export function poolDeNodo(arbol: PoolArbol[], nodoId: number): PoolArbol | undefined {
  return arbol.find((p) => p.lanes.some((l) => l.nodos.some((n) => n.id === nodoId)));
}

function mismo(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function candidatosCatch(
  arbol: PoolArbol[],
  mensajes: MensajeResponse[],
  origen: NodoEvento,
): NodoEvento[] {
  const poolOrigen = poolDeNodo(arbol, origen.id);
  const usados = new Set(mensajes.map((m) => m.eventoCatchId));
  return arbol
    .filter((p) => p !== poolOrigen)
    .flatMap((p) => p.lanes.flatMap((l) => l.nodos))
    .filter(
      (n): n is NodoEvento =>
        n.kind === 'evento' &&
        n.tipoEvento !== 'THROW' &&
        !usados.has(n.id) &&
        mismo(n.nombre, origen.nombre) &&
        mismo(n.claveCorrelacion, origen.claveCorrelacion),
    );
}

export function extremosMensaje(
  mensaje: MensajeResponse,
  arbol: PoolArbol[],
): { origen: NodoDiagrama; destino: NodoDiagrama } | null {
  const nodos = arbol.flatMap((p) => p.lanes.flatMap((l) => l.nodos));
  const origen = nodos.find((n) => n.id === mensaje.eventoThrowId);
  const destino = nodos.find((n) => n.id === mensaje.eventoCatchId);
  return origen && destino ? { origen, destino } : null;
}

export function requestCrearMensaje(
  arbol: PoolArbol[],
  origen: NodoEvento,
  destino: NodoEvento,
  contenido: string,
  politicaSinCaso: PoliticaMensajeSinCaso,
): MensajeRequest {
  return {
    nombre: origen.nombre,
    contenido: contenido.trim(),
    poolOrigenId: poolDeNodo(arbol, origen.id)?.pool.id ?? 0,
    poolDestinoId: poolDeNodo(arbol, destino.id)?.pool.id ?? 0,
    eventoThrowId: origen.id,
    eventoCatchId: destino.id,
    claveCorrelacion: origen.claveCorrelacion,
    politicaSinCaso,
  };
}

export function requestEditarMensaje(
  mensaje: MensajeResponse,
  contenido: string,
  politicaSinCaso: PoliticaMensajeSinCaso,
): EditarMensajeRequest {
  return { nombre: mensaje.nombre, contenido: contenido.trim(), politicaSinCaso };
}
