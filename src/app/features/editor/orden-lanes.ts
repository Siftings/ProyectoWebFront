// Nuevo orden de las lanes de un pool al subir o bajar una; null si no se puede mover.
export function moverLane(ids: readonly number[], id: number, delta: -1 | 1): number[] | null {
  const desde = ids.indexOf(id);
  const hasta = desde + delta;
  if (desde < 0 || hasta < 0 || hasta >= ids.length) {
    return null;
  }
  const nuevo = [...ids];
  [nuevo[desde], nuevo[hasta]] = [nuevo[hasta], nuevo[desde]];
  return nuevo;
}
