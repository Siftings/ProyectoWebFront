// Posición de un nodo tras arrastrarlo: entera y nunca negativa (relativa a su lane).
import { Punto } from './diagrama-layout';

export interface MovimientoNodo {
  id: number;
  posicionX: number;
  posicionY: number;
}

export function posicionArrastrada(origen: Punto, delta: Punto): Punto {
  return {
    x: Math.max(0, Math.round(origen.x + delta.x)),
    y: Math.max(0, Math.round(origen.y + delta.y)),
  };
}
